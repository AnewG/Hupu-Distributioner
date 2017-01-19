/****** Global ******/

    var url = '';        // 当前URL地址
    var floor = 0;       // 楼数
    var total_floor = 0; // 实际总楼数(单一更改)
    var level = 0;       // 等级
    var note = 0;        // 碎碎念
    var money = 0;       // 钱数
    var plus = '';       // 附言
    var note_group_1 = '';
    var note_group_2 = 0;

/****** Global ******/


// Start
$('#check').on('click',function(){

	// 检查楼层
	if($('#floor').val() == ''){
		floor = 0;
	}else{
		floor = parseInt($('#floor').val());
	}
	if(floor < 1){
		$('#info').html('楼数最少要大于等于一才可以运行');
		return false;
	}

	// 检查等级
	if($('#level').val() == ''){
		level = 0;
	}else{
		level = parseInt($('#level').val());
	}
	if(level < 0){
		$('#info').html('要被过滤的等级最少要大于等于0级');
		return false;		
	}

	// 检查钱数
	if($('#money').val() == ''){
		money = 0;
	}else{
		money = parseInt($('#money').val());
	}
	if(money < 50){
		$('#info').html('最低转账金额 50 卡');
		return false;		
	}

	// 转义附加留言
	if($('#plus').val() == ''){
		plus = '';
	}else{
		plus = encodeURIComponent($('#plus').val());
	}

	$('#check').html('检查中...');
	$('#check').prop('disabled', true);

	chrome.tabs.query({active: true}, function(tab) {
        url = tab[0].url;  // 保存主 Chrome 的 Tab 用来通知结果
        check_Url();
    });
    return true;

});

// 检查 URL
function check_Url(){
	if( (/https?\:\/\/bbs\.hupu\.com\/(\d{1,})\.html/.test(url)) || (/https?\:\/\/my\.hupu\.com\/(.{1,})\/note\/(\d{1,})\.html/.test(url)) ){
		if( (/note/.test(url)) ){
			note = 1;   
			(/https?\:\/\/my\.hupu\.com\/(.{1,})\/note\/(\d{1,})\.html/.test(url));
			note_group_1 = RegExp.$1;
			note_group_2 = RegExp.$2;
		}
		check_Floor();
		return true;
	}else{
		$('#info').html('请在正确的页面使用本扩展');
		return false;
	}
}

// 检查实际楼层
function check_Floor(){

    if(note){    //碎碎念
        var request;
        request = $.ajax({
            url: url,
            type: "get"
        });
        request.done(function (response, textStatus, jqXHR){
            total_floor = $(response).find('#j_reply'+note_group_2).html();
            total_floor = parseInt(total_floor);
            if(floor > total_floor){
            	// 楼数过大
            	$('#info').html('您填写的楼数超过了实际楼数，请减少您填写的数量后点击重试按钮');
            	$('#check').html('重试');
				$('#check').prop('disabled', false);
            }else{
            	// 正常
            	Send_Background();
            }
        });
        request.fail(function (jqXHR, textStatus, errorThrown){
            $('#info').html(
                "The following error occured in check_Floor: "+
                textStatus, errorThrown
            );
            $('#check').html('重试');
			$('#check').prop('disabled', false);
        });
    }else{   // 论坛帖子
        var request;
        request = $.ajax({
            url: url,
            type: "get"
        });
        request.done(function (response, textStatus, jqXHR){
            total_floor = $(response).find('#j_data').data('replies');
            total_floor = parseInt(total_floor);
            if(floor > total_floor){
            	// 楼数过大
            	$('#info').html('您填写的楼数超过了实际楼数，请减少您填写的数量后点击重试按钮');
            	$('#check').html('重试');
				$('#check').prop('disabled', false);
            }else{
            	// 正常
            	Send_Background();
            }
        });
        request.fail(function (jqXHR, textStatus, errorThrown){
            $('#info').html(
                "The following error occured in check_Floor: "+
                textStatus, errorThrown
            );
            $('#check').html('重试');
			$('#check').prop('disabled', false);
        });
    }
}

// 发送给后台脚本
function Send_Background(){
	var port_cwb = chrome.extension.connect({name: "Communication With Background"});
	port_cwb.postMessage({ 
		note  : note  ,
		level : level ,
		floor : floor ,
		url   : url   ,
		money : money ,
		plus  : plus
	});
	$('#check').html('操作中...');
	return true;
}
