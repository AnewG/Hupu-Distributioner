/****** Global ******/

	var tab_notify_id = 0;		  //要通知操作结果的Chrome标签页ID

	var bg_money      = 50;		  //要散的钱数
	var bg_plus       = '';		  //附加留言

	var bg_now  	  = 0;	          //当前已处理的楼数
        var bg_self_name  = '';           //散卡者自己的用户名
        var bg_bank_sign  = '';           //银行的 sign
        var bg_set        = new Array();  //待散人员
	var bg_total      = 0;            //总人数

/****** Global ******/

chrome.runtime || (chrome.runtime = chrome.extension, chrome.runtime.onMessage = chrome.extension.onRequest, chrome.runtime.sendMessage = chrome.extension.sendRequest);

// Start
chrome.extension.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
    if(port.name == "Communication With Background"){

		bg_money      = msg.money;
		bg_plus       = msg.plus;

		// Re Init
		bg_now             = 0;
		bg_self_name       = '';
		bg_bank_sign       = '';
        bg_set             = new Array();
		bg_set             = msg.bg_set;
		bg_total           = bg_set.length;

        for(var i=0;i<bg_total;i++){
            bg_set[i] = $.trim(bg_set[i]);
        }

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
				Bank();
			}
		}
	);	
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
	// 
	var tmp = bg_set.pop();
	if(typeof(tmp) != 'undefined'){
	    do_main(tmp);
  	    setTimeout(Distributioner, 3000);
	}else{
		return true;
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
    }else{
    	notify_content();  // 散卡者自己，不参与散卡	    	
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
	
	bg_now += 1;

    chrome.tabs.sendMessage(tab_notify_id, 
    	{
    		action     : "update_one",
    		now        : bg_now,
    		name 	   : name,
    		total      : bg_total
    	}, 
    	function(response) {}
    );
}
