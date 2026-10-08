

    function send11() {



        var a1 = document.getElementById("a11").value;
        if (a1 == "") { alert("Please input your theme here, it is very important!"); document.getElementById("a1").focus(); return false; }
        var a2 = document.getElementById("a2").value;
        if (a2 == "") { alert("Please input your name here, it is very important!"); document.getElementById("a2").focus(); return false; }
        var a3 = document.getElementById("a3").value;

        var a4 = document.getElementById("a4").value;


        if (a3 == "" && a4 == "") { alert("必填一个"); return false; }
        var a5 = document.getElementById("a5").value;
        if (a5 == "") { alert("Please input your Content here, it is very important!"); document.getElementById("a5").focus(); return false; }
       

        //提交信息开始
        $.ajax({
            type: "get",
            url: "Check/CheckSubmit.aspx?All=" + escape("theme:" + a1 + ",name:" + a2 + ",mobile:" + a3 + ",Email:" + a4 + ",nr:" + a5),

            success: function (msg) {
                if (msg == "success") {

                    alert("恭喜你，资料提交成功！");
                    location.reload();
                }
                else {

                    alert("含非法字符，资料提交失败！");
                }
            }
        });

    } 
            


    