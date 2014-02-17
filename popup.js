/****** Global ******/
	var list = '';

    var money = 0;       // 钱数
    var plus = '';       // 附言

    var bg_set = new Array();  // 自定义列表
/****** Global ******/


// Start
$('#check').on('click',function(){

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

	if($('#list').val() == ''){
		list = '';
		return false;
	}else{
		list = $('#list').val();
		bg_set = list.split('>');
	}

	$('#check').html('检查中...');
	$('#check').prop('disabled', true);

	chrome.tabs.query({active: true}, function(tab) {
        url = tab[0].url;  // 保存主 Chrome 的 Tab 用来通知结果
        Send_Background();
    });
    return true;

});

// 发送给后台脚本
function Send_Background(){
	var port_cwb = chrome.extension.connect({name: "Communication With Background"});
	port_cwb.postMessage({ 
		money : money ,
		plus  : plus ,
		bg_set: bg_set
	});
	$('#check').html('操作中...');
	return true;
}
