

//重组url
function GetUrl(param)//传参数（如：paixu=1）
{
    param = param.toLowerCase();
    var tzurl = "";
    var dqurl = window.location.href;

    //判断当前是否包含默认参数
    if (dqurl.indexOf("?") == -1) {
        if (dqurl.indexOf("?spm") == -1) {
            dqurl = dqurl + "?spm=1";
        }
    }
    var len = param.indexOf("=");

    //获取去掉值的参数
    var casnhu = param.substring(0, len + 1);

    //判断是否包含当前参数 -1 没有
    if (dqurl.indexOf(casnhu) > -1) //有当前参数
    {
        var tihuan = new RegExp("&" + casnhu + "([^&]*)");
        if (casnhu == param) {
            tzurl = dqurl.replace(tihuan, "")
        }
        else {
            tzurl = dqurl.replace(tihuan, "&" + param)
        }
    }
    else {
        if (param.indexOf("=") == param.length - 1)//当前参数为空
        {
            tzurl = dqurl; //参数无效 返回false;
            return false;
        }
        else {
            tzurl = dqurl + "&" + param;
        }
    }
    //替换spm
    var regspm = new RegExp("spm=([^&]*)");
    tzurl = tzurl.replace(regspm, "spm=" + GetSpm(6).toLowerCase())
    window.location.href = tzurl;
}

//获取随机码
function GetSpm(len) {
    code = "";
    var selectChar = new Array('0.', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', 'A', 'B', 'C', 'D', 'V', 'a', 'g', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'x', 'y', 'z');
    for (var i = 0; i < len; i++) {
        var charIndex = Math.floor(Math.random() * 26);
        code += selectChar[charIndex];
    }
    return "a" + code;
}