var express = require('express');
var flash = require('connect-flash');
var session = require('express-session');
var app = express();
var port = process.env.PORT || 80;
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var Controllers_lecture = require('./controllers/lecture.js')
var Controllers_question = require('./controllers/question.js')
var Controllers_user = require('./controllers/user.js')
var Controllers_audituser = require('./controllers/audituser.js')

app.use(bodyParser())
app.use(flash())
app.use(session({
    //secret:settings.cookieSecret,
    secret: 'technnode',
    //key:settings.db,
    cookie: {
        //1days TTL
        maxAge: 60 * 1000 * 60 * 24
    }
}))

app.use(express.static(__dirname + '/static'));
var api = require('./routes/api.js')
app.use('/api', api)

app.use('/', function(req, res) {
    res.sendfile('./static/index.html');
});

var io = require('socket.io').listen(app.listen(port));

console.log('quesboard is on port ' + port + '!');

io.sockets.on('connection', function(socket) {
    socket.emit('connected');
    socket.on('joinRoom', function(join) {
        socket.join(join.section_Id)
        socket.emit('joinRoom', "you are in: " + join.section_Id)
    })

    socket.on('getAllMessages', function(data) {
        var user_Id = data.user_Id;
        var section_Id = data.section_Id;
        var lecture_Id = data.lecture_Id;
        Controllers_lecture.findCreatorById(lecture_Id, function(err, lec) {
            if (lec.creator._id && lec && user_Id === lec.creator._id.toString()) {
                Controllers_question.getAllQuestions(section_Id, function(err, msg) {
                    if (err) {
                        console.log('getAllQuestions failed')
                    } else {
                        messages = msg
                        Controllers_user.getAllVote(user_Id, function(err, votedarray) {
                            if (err) {
                                console.log('test')
                            } else {
                                if (votedarray.length !== 0) {
                                    for (var i = 0; i < votedarray.length; i++) {
                                        for (var item = 0; item < messages.length; item++) {
                                            if (messages[item]._id.toString() === votedarray[i]) {
                                                messages[item]['voteed'] = true
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            socket.emit('allMessages', [messages,true]) // 1 stand for craetor
                            // socket.emit('allMessages', messagess)
                        })
                    }
                })
            } else {
                Controllers_question.getActiveQuestions(section_Id, function(err, msg) {
                    if (err) {
                        console.log('getActiveQuestions failed')
                    } else {
                        messages = msg
                        Controllers_user.getAllVote(user_Id, function(err, votedarray) {
                            if (err) {
                                console.log('test')
                            } else {
                                if (votedarray.length !== 0) {
                                    for (var i = 0; i < votedarray.length; i++) {
                                        for (var item = 0; item < messages.length; item++) {
                                            if (messages[item]._id.toString() === votedarray[i]) {
                                                messages[item]['voteed'] = true
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            socket.emit('allMessages', [messages,false])// 2 stand for audience
                            // socket.emit('allMessages', messages)
                        })
                    }
                })
            }
        })
    })

    socket.on('createMessage', function(message) {
        var newquestion = {
            content: message.content,
            sectionId: message.section_Id,
            creator: {
                _id: message.user_Id,
                name: message.name,
                avatarUrl: message.avatarUrl
            }
        }
        Controllers_lecture.increaseQuestion(message.lecture_Id, function(err, msg){})
        Controllers_question.createNewQuestion(newquestion, function(err, msg) {
            if (err) {
                res.send(err)
            } else {
                messages.push(msg);
                socket.in(message.section_Id).broadcast.emit('messageAdded', msg)
                socket.emit('messageAdded', msg)
            }
        })
    })

    socket.on('vote', function(data) {
        Controllers_user.voteQues(data.user_Id, data.ques_Id, function(err, msg) {})
        Controllers_question.voteQuestions(data.ques_Id, function(err, msg) {})
        Controllers_lecture.increaseVote(data.lecture_Id, function(err, msg){})
        io.sockets.emit('triggervote', data.ques_Id)
    })
    socket.on('unvote', function(data) {
        Controllers_user.unvoteQues(data.user_Id, data.ques_Id, function(err, msg) {})
        Controllers_question.unvoteQuestions(data.ques_Id, function(err, msg) {})
        Controllers_lecture.decreaseVote(data.lecture_Id, function(err, msg){})
        io.sockets.emit('triggerunvote', data.ques_Id)
    })
    socket.on('off', function(data){
        Controllers_question.offQuestion(data.ques_Id, function(err, msg){})
    })
    socket.on('on', function(data){
        Controllers_question.onQuestion(data.ques_Id, function(err, msg){})
    })

});
//End of Message Send
