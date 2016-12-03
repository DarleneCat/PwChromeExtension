//ToDo guid for pwmanager
var PwAddonHost = "";
chrome.runtime.sendMessage({"request":"host"}, function(response) {
    PwAddonHost = response["data"]["url"];
}
    if (document.location.href.startsWith(PwAddonHost+'password.php')) {
        console.log('PwChromeAddon injected');
        document.addEventListener('secretKeyReady', function(e){
            //send message to ext
            console.log(e.detail);
            chrome.runtime.sendMessage({"request":"session", "data":e.detail}, function(response) {
                //callback
            });
        }, false);

        document.addEventListener('loggedOut', function(e){
            //send message to ext
            chrome.runtime.sendMessage({"request":"logout"}, function(response) {
                //callback
            });
        }, false);

        function executeScript(script,args) {
            var payload = '(' + script + ')('+JSON.stringify(args)+');';
            var script = document.createElement('script');
            script.textContent = payload;
            (document.head||document.documentElement).appendChild(script);
            script.remove();
        }

        console.log(103);
        function getActions() {
            console.log("ask for actions");
            chrome.runtime.sendMessage({"request":"actions"}, function(response) {
                console.log(response);
                var request = response;//JSON.parse(response);
                switch(request["request"]){
                    case "login":
                        //data contains secretkey. It must be set using executeScript
                        executeScript(function(data){
                            if (thisIsThePasswordManager != "21688ab4-8e22-43b0-a988-2ca2c98e5796")
                                return;
                            console.log('logging in');
                            console.log(data);
                            var salt = data["salt"];
                            setpwdstore(data["sk"],decryptchar(data["confKey"],salt),salt);
                        }, {'sk': request["data"]["sk"],'confKey': request["data"]["confKey"], "salt":request["data"]["salt"]});
                        getActions();
                        break;
                    case "logout":
                        executeScript(function(data){
                            if (thisIsThePasswordManager != "21688ab4-8e22-43b0-a988-2ca2c98e5796")
                                return;
                            quitpwd();
                        }, null);
                        break;
                    case "edit":
                        executeScript(function(data){
                            if (thisIsThePasswordManager != "21688ab4-8e22-43b0-a988-2ca2c98e5796")
                                return;
                            edit(data["index"]);
                        }, {'index': request["data"]});
                        break;
                    case "addAccount":
                        executeScript(function(data){
                            if (thisIsThePasswordManager != "21688ab4-8e22-43b0-a988-2ca2c98e5796")
                                return;
                            $('#add').modal('show');
                            console.log("Setting URL field to "+data["url"]);
                            $("#newiteminputurl").val(data["url"]);
                        }, {"url":request["data"]["url"]});
                        break;
                    case "none": break;
                }
            });
        }
        getActions();
        console.log(104);

        executeScript(function(){
            if (thisIsThePasswordManager != "21688ab4-8e22-43b0-a988-2ca2c98e5796")
                return;
            var dataReadyOriginal = dataReady; 
            dataReady = function(data) {
                console.log("105 - before");
                dataReadyOriginal(data);
                console.log("100 - after");
                var evt= new CustomEvent("secretKeyReady", {'detail':{'secretkey': secretkey, 'secretkey0': getpwdstore(salt2), 'session_token': localStorage.session_token, 'confkey': getconfkey(salt2), 'username':getcookie('username') }});
                document.dispatchEvent(evt);
            };
            var quitpwdOriginal = quitpwd;
            quitpwd = function() {
                var evt= new CustomEvent("loggedOut", {});
                document.dispatchEvent(evt);
                quitpwdOriginal();
            }
            var quitpwd_untrustOriginal = quitpwd_untrust;
            quitpwd_untrust = function() {
                var evt= new CustomEvent("loggedOut", {});
                document.dispatchEvent(evt);
                quitpwd_untrustOriginal();
            }
            console.log(101);
        },null);
        console.log(102);
    }
});
