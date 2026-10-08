//检验提交数据格式合法性
function checkNull() {
    var title = $("input[name='txtTitle']").val();
    var realname = $("input[name='txtRealname']").val();
    var phone = $("input[name='txtPhone']").val();
    var email = $("input[name='txtEmail']").val();
    var content = $("textarea[name='txtContent']").val();
    if (title == "") { alert("请输入咨询主题！"); $("input[name='txtTitle']").focus(); return false; }
    if (realname == "") { alert("请输入姓名！"); $("input[name='txtRealname']").focus(); return false; }
    if (phone == "") { alert("请输入手机号码！"); $("input[name='txtPhone']").focus(); return false; }
    else if (!(/^13\d{9}$/g.test(phone)) && !(/^15\d{9}$/g.test(phone)) && !(/^18\d{9}$/g.test(phone)))
    { alert("手机号码格式不对！"); $("input[name='txtPhone']").focus(); return false; }
    if (email == "") { alert("请输入邮箱！"); $("input[name='txtEmail']").focus(); return false; }
    else if (!/^[\w-]+(\.[\w-]+)*@[\w-]+(\.(\w)+)*(\.(\w){2,3})$/.test(email))
    { alert("Email地址不合法！E-mail格式：123@abc.com"); $("input[name='txtEmail']").focus(); return false; }
    if (content == "") { alert("请输入留言内容！"); $("textarea[name='txtContent']").focus(); return false; }
    document.getElementsByName('Button1')[0].disabled = true;
    //提交信息开始
    $.ajax({
        type: "get",
        url: "/Check/CheckMessage2.aspx?Title=" + escape(title) + "&Realname=" + escape(realname) + "&Phone=" + escape(phone) + "&Email=" + escape(email) + "&Content=" + escape(content),
        success: function (msg) {
            if (msg == "success") {
                alert("恭喜你，提交成功！");
                window.location.reload();
            }
            else if (msg == "failure") {
                document.getElementsByName('Button1')[0].disabled  = false;
                alert("很遗憾，提交失败！");
            }
            else if (msg == "error") {
                document.getElementsByName('Button1')[0].disabled = false;
                alert("您的请求带有不合法的参数，谢谢合作！");
            }
        }
    });
    //提交信息结束
}
