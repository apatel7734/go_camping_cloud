require("cloud/app.js");

var twilioAccountSid = 'AC48de99ab1c557344604f321b13163063';
var twilioAuthToken = '361fb935d419e47b912c47d622279c8b';
var twilioPhoneNumber = '+19259058117';
var secretPasswordToken = 'firstapppasswordtoken';

var language = "en";
var languages = ["en", "es", "ja", "kr", "pt-BR"];

var twilio = require('twilio')(twilioAccountSid, twilioAuthToken);

Parse.Cloud.define("addUpdateMember", function(request,response){
	var memberName = request.params.memberName
	var familyId = request.params.familyId
	var phoneNumber = request.params.phoneNumber
	var email = request.params.email
	var age = request.age
	var campingTripId = request.params.campingTripId
	var query = new Parse.Query("CampingTrip")
	
	console.log(request.params);

	query.find().then(function(campingTrip) {
    console.log(campingTrip);
    response.success(campingTrip);

  }, function(error) {
    // Make sure to catch any errors, otherwise you may see a "success/error not called" error in Cloud Code.
    	response.error("Could not retrieve Posts, error " + error.code + ": " + error.message);
  });
});

Parse.Cloud.define("deleteMember", function(request,response){
	var memberId = request.params.memberId
	var campingTripId = request.params.campingTripId

	response.success()
});

Parse.Cloud.define("addUpdateExpense", function(request,response){
	var expenseName = request.params.expenseName
	var desc = request.params.desc
	var amount = request.params.amount
	var familyId = request.params.familyId
	var campingTripId = request.params.campingTripId

	var totalTripExpense = 

	response.success()
});

Parse.Cloud.define("deleteExpense", function(request,response){
	var expenseId = request.params.expenseId
	var campingTripId = request.params.campingTripId
	response.success()
});


Parse.Cloud.define("sendCode", function(req, res) {
	var phoneNumber = req.params.phoneNumber;
	phoneNumber = phoneNumber.replace(/\D/g, '');

	var lang = req.params.language;
  if(lang !== undefined && languages.indexOf(lang) != -1) {
		language = lang;
	}

	if (!phoneNumber || (phoneNumber.length != 10 && phoneNumber.length != 11)) return res.error('Invalid Parameters');
	Parse.Cloud.useMasterKey();
	var query = new Parse.Query(Parse.User);
	query.equalTo('username', phoneNumber + "");
	query.first().then(function(result) {
		var min = 1000; var max = 9999;
		var num = Math.floor(Math.random() * (max - min + 1)) + min;

		if (result) {
			result.setPassword(secretPasswordToken + num);
			result.set("language", language);
			result.save().then(function() {
				return sendCodeSms(phoneNumber, num, language);
			}).then(function() {
				res.success();
			}, function(err) {
				res.error(err);
			});
		} else {
			var user = new Parse.User();
			user.setUsername(phoneNumber);
			user.setPassword(secretPasswordToken + num);
			user.set("language", language);
			user.setACL({});
			user.save().then(function(a) {
				return sendCodeSms(phoneNumber, num, language);
			}).then(function() {
				res.success();
			}, function(err) {
				res.error(err);
			});
		}
	}, function (err) {
		res.error(err);
	});
});

Parse.Cloud.define("logIn", function(req, res) {
	Parse.Cloud.useMasterKey();

	var phoneNumber = req.params.phoneNumber;
	phoneNumber = phoneNumber.replace(/\D/g, '');

	if (phoneNumber && req.params.codeEntry) {
		Parse.User.logIn(phoneNumber, secretPasswordToken + req.params.codeEntry).then(function (user) {
			res.success(user.getSessionToken());
		}, function (err) {
			res.error(err);
		});
	} else {
		res.error('Invalid parameters.');
	}
});

function sendCodeSms(phoneNumber, code, language) {
	var prefix = "+1";
	if(typeof language !== undefined && language == "ja") {
		prefix = "+81";
	} else if (typeof language !== undefined && language == "kr") {
		prefix = "+82";
		phoneNumber = phoneNumber.substring(1);
	} else if (typeof language !== undefined && language == "pt-BR") {
		prefix = "+55";
  }

	var promise = new Parse.Promise();
	twilio.sendSms({
		to: prefix + phoneNumber.replace(/\D/g, ''),
		from: twilioPhoneNumber.replace(/\D/g, ''),
		body: 'Your login code for GoCamping is ' + code
	}, function(err, responseData) {
		if (err) {
			console.log(err);
			promise.reject(err.message);
		} else {
			promise.resolve();
		}
	});
	return promise;
}




