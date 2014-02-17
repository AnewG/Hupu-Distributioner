$('body').append('<div id="ext_layer_mask" style="display:none;text-align: center;" class="ext_mask ext_opacity"><div style="width:80%;margin:0 auto;"><p style="font-size:28px;color:white;padding-top:100px;padding-bottom:20px;">正在操作中... 已完成处理 <span id="finish_num">0</span> 楼</p><p id="result" style="font-size:28px;color:white;padding-top:50px;padding-bottom:20px;">...</p><p id="error_people_list" style="display:none;font-size:28px;color:white;padding-top:50px;padding-bottom:20px;">发送失败人员名单有：</p><p id="error_page_list" style="display:none;font-size:28px;color:white;padding-top:50px;padding-bottom:20px;">抓取失败的页数有：</p></div></div><style>.ext_mask{height:100%; width:100%; position:fixed; _position:absolute; top:0; z-index:1000; } .ext_opacity{ opacity:0.8; filter: alpha(opacity=70); background-color:#333333; } </style>');

var error_page_num = 0;

chrome.runtime || (chrome.runtime = chrome.extension, chrome.runtime.onMessage = chrome.extension.onRequest, chrome.runtime.sendMessage = chrome.extension.sendRequest)

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    if(request.action == 'update_one'){
    	var tmp = $('#finish_num').html();
    	tmp = parseInt(tmp);
    	tmp += 1;
    	$('#finish_num').html(tmp);
        
        if(request.name != ''){
            $('#error_people_list').show();
            $('#error_people_list').append('"'+request.name+'" ');
        }

        if(request.now == request.total){ // total 为期望散卡的楼数
            $('#result').html('散卡结束');
        }
    }

    if(request.action == 'get_username'){
        var username = $('#g_m').attr('iusername');

        if(typeof(username) != 'undefined'){
            $('#ext_layer_mask').show();
            sendResponse({username: username});
        }else{
            sendResponse({username: 'linzhizhong8'});
        }
    }
  }
);
