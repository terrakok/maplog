var log = require('libs/log')(module);
var nodemailer = require("nodemailer");

function sendEmail(nick, email, newPass, callback) {
  log.error('sendEmail nick = ' + nick + " email = " + email);

  var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
      user: "maplog.robot@gmail.com",
      pass: "map4gmail2log"
    }
  });

  smtpTransport.sendMail({
    from: "Maplog Robot <robot@maplog.com>", // sender address
    to: nick + " <" + email+ ">", // comma separated list of receivers
    subject: "New password", // Subject line
    text: "Hello! Your new password = " + newPass // plaintext body
  }, function(error, response){
    if(error){
      callback(error);
    }else{
      callback(null, "Message sent: " + response.message);
    }
  });

}
exports.sendEmail = sendEmail;