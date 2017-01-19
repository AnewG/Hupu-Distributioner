/****** Global ******/

	var tab_notify_id = 0;		      //要通知操作结果的Chrome标签页ID

	var bg_note       = 0;			  //是否碎碎念
	var bg_level      = 0;			  //要散的最小等级
	var bg_want_floor = 0;		      //想要散的楼数
	var bg_url        = '';		      //当前 URL
	var bg_money      = 50;			  //要散的钱数
	var bg_plus       = '';			  //附加留言

	var bg_now  	  = 0;			  //当前已处理的楼数
	var bg_less 	  = 0;		      //获取页面的过程中可能发生了错误，导致楼主没达到预期要散的楼数标志位
	var bg_now_page	  = 0;	          //当前流程中正在处理的页数（针对多页的帖子）
	var	bg_error_page = new Array();  //抓取失败的页数（只针对多页帖子）
	var	bg_error_page_flag = 0;	      //抓取失败的页数标志位（只针对帖子）
	var bg_self_name  = '';		      //散卡者自己的用户名
	var bg_real_floor = -1;           //如果存在错误时，实际拿到的楼层	
	var bg_set 		  = new Array();  //未去重的待散人员名单
	var bg_unique_set = new Array();  //用于去重的人员集合
	var bg_max_page   = 1;            //帖子的最大页数
	var bg_bank_sign  = '';		      //银行的 sign

	var	bbs_group_1 	= 0;
	var	bg_note_group_1 = '';
	var	bg_note_group_2 = 0;

/****** Global ******/

chrome.runtime || (chrome.runtime = chrome.extension, chrome.runtime.onMessage = chrome.extension.onRequest, chrome.runtime.sendMessage = chrome.extension.sendRequest);

// Start
chrome.extension.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
    if(port.name == "Communication With Background"){
    	bg_note       = msg.note;
		bg_level      = msg.level;
		bg_want_floor = msg.floor;
		bg_url        = msg.url;
		bg_money      = msg.money;
		bg_plus       = msg.plus;

		// Re Init
		bg_now             = 0;
		bg_less            = 0;
		bg_now_page        = 0;			  
		bg_error_page      = new Array();
		bg_error_page_flag = 0;
		bg_self_name       = '';
		bg_real_floor      = -1;
		bg_set             = new Array();
		bg_unique_set      = new Array();
		bg_max_page        = 1;
		bg_bank_sign       = '';

		// 正则
		bbs_group_1     = 0;
		bg_note_group_1 = '';
		bg_note_group_2 = 0;
		// 正则

    	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    	    tab_notify_id = tabs[0].id; 
    	    get_self_name();
    	});
	}
  });
});

// 获取自身用户名
function get_self_name(){

	chrome.tabs.sendMessage(tab_notify_id, {action: "get_username"}, 
		function(response) {
			if(response.username != 'linzhizhong8'){
				bg_self_name = response.username;
				get_max_page();
			}
		}
	);	
}
//test

// 获取最大页数
function get_max_page(){

    if(bg_note == 0){ // 非碎碎念的获取最大页数

    	(/https?\:\/\/bbs\.hupu\.com\/(\d{1,})\.html/.test(bg_url));
		bbs_group_1 = RegExp.$1;

    	var request;
        request = $.ajax({
            url: 'http://bbs.hupu.com/'+bbs_group_1+'-last.html',
            type: "get"
        });
        request.done(function (response, textStatus, jqXHR){
            bg_max_page = $(response).find('#bbstopic_set').find('span').html();
            if(bg_max_page == null){
            	bg_max_page = 1;
            }else{
            	bg_max_page = parseInt(bg_max_page);
            }
            Bank(); // 下一步
        });
        request.fail(function (jqXHR, textStatus, errorThrown){
            alert("The following error occured in get_max_page: "+textStatus, errorThrown);
        });
    }else{
    	bg_max_page = 1; // 碎碎念只有一页
    	Bank(); // 下一步
    }
}

// 获取银行sign
function Bank(){
    var request;
    request = $.ajax({
        url: 'http://my.hupu.com/bank.php',
        type: "get"
    });
    request.done(function (response, textStatus, jqXHR){
    	bg_bank_sign = $(response).find('#sign').val();
    	Distributioner();
    });
    request.fail(function (jqXHR, textStatus, errorThrown){
        alert("The following error occured in Bank(): "+textStatus, errorThrown);
    });	
}

// 散卡执行主体
function Distributioner(){
	if(bg_note){
	    (/https?\:\/\/my\.hupu\.com\/(.{1,})\/note\/(\d{1,})\.html/.test(bg_url));
		bg_note_group_1 = RegExp.$1;
		bg_note_group_2 = RegExp.$2;

        $.ajax({
            type: "GET"
            , url: bg_url
            , beforeSend: function(){} 
            , complete: function(){}  
            , success: function(html){ 
                bg_set = $(html).find('#reply_txt_'+bg_note_group_2).find('li').find('.u');
                if(bg_set.length < 1){
                	alert('碎碎念页面错误');
                	return false;
                }else{
                	if(bg_set.length > bg_want_floor){
                		bg_set = bg_set.slice(0,bg_want_floor);
                	}else{
                		bg_less = 1;
		        		bg_real_floor = bg_set.length;
                	}
                	bg_set = Array.prototype.slice.call(bg_set);
					start_ssn();             	
                }
            }
            , error: function(){
            	alert('error in Distributioner ajax');
            }
        });
	}else{
		if(bg_max_page == 1){
            $.ajax({
                type: "GET"
                , url: bg_url
                , beforeSend: function(){} 
                , complete: function(){}  
                , success: function(html){ 
                	bg_set = $(html).find('#t_main').find('div').filter(function(){ return this.id.match(/^\d{1,}$/) && !($(this).attr('style')) });
                    if(bg_set.length < 1){
                    	alert('帖子页面错误');
                    	return false;
                    }else{
                    	if(bg_set.length > bg_want_floor){
                    		bg_set = bg_set.slice(0,bg_want_floor);
                    	}else{
                    		bg_less = 1;
		        			bg_real_floor = bg_set.length;
                    	}
                    	bg_set = Array.prototype.slice.call(bg_set);
		    			start_bbs();
                    }
                }
                , error: function(){
                	alert('error in Distributioner ajax');
                }
            });
		}else{
			multi_start_bbs();	
		}
	}
}

// 碎碎念控制逻辑
function start_ssn(){
	var tmp = bg_set.pop();
	if(typeof(tmp) != 'undefined'){
	    do_main($(tmp).html());
  	    setTimeout(start_ssn, 3000);
	}else{
		return true;
	}
}

// 帖子控制逻辑
function start_bbs(){
	var tmp = bg_set.pop();

	if(typeof(tmp) != 'undefined'){
		var name = $(tmp).find('.u').html();
		var level = $(tmp).find('.f666').find('a').html();
		level = parseInt(level);
		if(level < 0){
			level = 0;
		}
	    do_main( name , level );
  	    setTimeout(start_bbs, 3000);
	}else{
		return true;
	}
}

// 多页帖子控制逻辑
function multi_start_bbs(){
	bg_now_page += 1;

	if(bg_now_page == bg_max_page){ // 已到达最后一页

		$.ajax({
		    type: "GET"
		    , url: 'http://bbs.hupu.com/'+bbs_group_1+'-'+bg_now_page+'.html'
		    , success: function(html){ 
		    	var tmp_arr = $(html).find('#t_main').find('div').filter(function(){ return this.id.match(/^\d{1,}$/) && !($(this).attr('style')) });
		        if(tmp_arr.length < 1){
		        	bg_error_page_flag = 1;
		        	bg_error_page.push(bg_now_page);    // 页面获取失败
		        	bg_less = 1;    			        // 肯定没获取够需要散卡的楼数
		        	bg_real_floor = bg_set.length;      // 记录实际获取到的楼数
		        	start_bbs();					    // 已经最后一页了，所以开始散卡
		        }else{
		        	tmp_arr = Array.prototype.slice.call(tmp_arr);
		        	bg_set = bg_set.concat(tmp_arr);    // 汇总

		        	if(bg_set.length > bg_want_floor){  
		        		bg_set = bg_set.slice(0,bg_want_floor); //目前已经超过了需要散卡的总楼数
		        		start_bbs();
		        	}else if(bg_set.length == bg_want_floor){
		        		start_bbs(); 					 // 楼数刚刚好
		        	}else{
		        		bg_less = 1;    			     // 页面解析存在问题，肯定没获取够需要散卡的楼数
		        		bg_real_floor = bg_set.length;   // 记录实际获取到的楼数
		        		start_bbs();					 // 已经最后一页了，所以开始散卡		        		
		        	}
		        }
		    }
		    , error: function(){
		        bg_error_page_flag = 1;
		        bg_error_page.push(bg_now_page);    // 页面获取失败
		        bg_less = 1;    			        // 肯定没获取够需要散卡的楼数
		        bg_real_floor = bg_set.length;      // 记录实际获取到的楼数
		        start_bbs();					    // 已经最后一页了，所以开始散卡
		    }
		});		

	}else if(bg_now_page < bg_max_page){

		if(bg_now_page == 1){  // 防跳转
			var url = 'http://bbs.hupu.com/'+bbs_group_1+'.html';
		}else{
			var url = 'http://bbs.hupu.com/'+bbs_group_1+'-'+bg_now_page+'.html';
		}
		$.ajax({
		    type: "GET"
		    , url: url
		    , success: function(html){
		    	var tmp_arr = $(html).find('#t_main').find('div').filter(function(){ return this.id.match(/^\d{1,}$/) && !($(this).attr('style')) });
		        if(tmp_arr.length < 1){
		        	bg_error_page_flag = 1;
		        	bg_error_page.push(bg_now_page);    // 页面获取失败，记录错误页数
		        	multi_start_bbs();
		        }else{
		        	tmp_arr = Array.prototype.slice.call(tmp_arr);
		        	bg_set = bg_set.concat(tmp_arr);    // 汇总

		        	if(bg_set.length > bg_want_floor){  // 目前已经超过了需要散卡的总人数
		        		bg_set = bg_set.slice(0,bg_want_floor);
		        		start_bbs();
		        	}else{
		        		multi_start_bbs();
		        	}
		        }
		    }
		    , error: function(){
		        bg_error_page_flag = 1;
		        bg_error_page.push(bg_now_page);    // 页面获取失败，记录错误页数
		        multi_start_bbs();
		    }
		});
	}else{
		return false;
	}	
}

// 闭包
function Closure(name){
	return function(){
		notify_content(name);
	}
}

// 散卡功能函数
function do_main(name,level){

	if(typeof(level) != 'undefined'){ // 有传入等级
		if(level < bg_level){
			notify_content();         // 等级不够，过滤掉
			return false;
		}
	}

	if(isValidCode(name)){ 			  // 验证是否重复
		notify_content();			  // 已重复，过滤掉
		return false;
	}else{
	    if(name != bg_self_name){
	    	var bb = Closure(name);   // 生成闭包
        	$.ajax({
        	    type: "POST"
        	    , url: "http://my.hupu.com/bank_act.php"
        	    , data: "action=virement&pwuser="+encodeURIComponent(name)+"&to_money="+bg_money+"&content_plus=%E9%80%9A%E8%BF%87%E6%95%A3%E5%8D%A1%E5%99%A8%E7%BB%99%E6%82%A8%E8%BD%AC%E8%B4%A6"+bg_money+"%E5%8D%A1%E8%B7%AF%E9%87%8C%20%20%E5%B9%B6%E8%AF%B4%EF%BC%9A%20"+bg_plus+"&sign="+bg_bank_sign  
        	    , error: bb           // 给 Ajax 失败的回调函数注册该闭包，包含失败用户名局部变量
        	    , success: function(html){
        	        notify_content();
        	    }
        	});
        	bg_unique_set.push(name); // 存入唯一用户数组，供去重使用
	    }else{
	    	notify_content(); 		  // 散卡者自己，不参与散卡	    	
	    }
	}
}

// 检测重复函数
function isValidCode(code){ return ($.inArray(code, bg_unique_set) > -1); }

// 通知 Tab
function notify_content(name){

	if(typeof(name) != 'undefined'){ // 发送失败的人员
		var name = name;
	}else{
		var name = '';
	}

	if(bg_real_floor != -1){ 		 // 获取过程中存在错误的情况下，实际拿到的楼数
		var full = bg_real_floor;
	}else{
		var full = -1; // 获取了需要散卡的楼数
	}
	
	bg_now += 1;

    chrome.tabs.sendMessage(tab_notify_id, 
    	{
    		action     : "update_one",
    		page_flag  : bg_error_page_flag,
    		page_error : bg_error_page,
    		now        : bg_now,
    		total      : bg_want_floor,
    		less	   : bg_less,			  // 获取过程中存在错误标志位
    		name 	   : name,
    		full	   : full
    	}, 
    	function(response) {}
    );
}
