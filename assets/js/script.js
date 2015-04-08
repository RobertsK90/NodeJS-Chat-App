/**
 * Created by Roberts on 1/6/15.
 */

(function($){
    $(function () {
        var socket = io.connect('http://localhost:8080'),
            messageForm = $('.message-form'),
            message = $('.message-input'),
            chatPage = $('.chat-page'),
            chat = $('.chat-messages'),
            nickForm = $('.nickname-form'),
            nickError = $('.nick-error'),
            nickname = $('.nickname'),
            users = $('.users-list');


        nickForm.submit(function (e) {
            e.preventDefault();
            nick = nickname.val();
            nick = nick.trim();

            if (nick.length < 3 || nick.length > 8) {
                nickError.html('Nickname must be between 3 and 8 characters long');
            } else {
                socket.emit('new user', encodeURI(nick), function (data) {
                    if (data) {
                        chatPage.show();
                        nickError.hide();
                        nickForm.hide();
                    } else {
                        nickError.html('User with that name already present in chat room.');
                    }
                });
            }

            nickname.val('');
        });

        socket.on('usernames', function (data) {
            var html = '';
            for (i = 0; i < data.nicknames.length; i++) {
                html += data.nicknames[i] + "<br/>"
                users.html(html);
            }

            chat.append("<span class='log'>" + data.user + " has just " + data.act + "</span><br/>");
        });

        message.keypress(function (e) {
            if (e.keyCode == 13 && e.ctrlKey) {
                var content = $(this).val();
                var caret = getCaret(this);
                $(this).val(content.substring(0,caret)+
                    "\n"+content.substring(caret,content.length));
                e.stopPropagation();
            } else if (e.keyCode == 13){
                messageForm.submit();

            }
        });


        function getCaret(el) {
            if (el.selectionStart) {
                return el.selectionStart;
            } else if (document.selection) {
                el.focus();

                var r = document.selection.createRange();
                if (r == null) {
                    return 0;
                }

                var re = el.createTextRange(),
                    rc = re.duplicate();
                re.moveToBookmark(r.getBookmark());
                rc.setEndPoint('EndToStart', re);

                return rc.text.length;
            }
            return 0;
        }



        messageForm.submit(function (e) {
            e.preventDefault();
            socket.emit('send message', message.val(), function (data) {
                chat.append("<span class='error'>" + data + "</span><br/>");
            });

            message.val('');
        });

        socket.on('new message', function (data) {
            data.reverse();
            $.each(data, function(index, message){
                chat.append("<strong><span class='message'>" + message.nickname + "</strong>: " + message.message + "</span><br/>");
                chat.animate({
                   scrollTop: chat.get(0).scrollHeight}, 2000);
            });


        });

        socket.on('private message', function (data) {
            chat.append("<strong><span class='pm'>" + data.nickname + "</strong>: " + data.message + "</span><br/>");
        });

    });
})(jQuery);
