var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/test')
exports.User = mongoose.model('User', require('./user'))
exports.Qusetion= mongoose.model('Qusetion',require('./question'))
exports.Section= mongoose.model('Section',require('./section'))
exports.Lecture= mongoose.model('Lecture',require('./lecture'))
exports.Audituser= mongoose.model('Audituser',require('./audituser'))