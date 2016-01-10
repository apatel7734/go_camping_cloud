	require("cloud/app.js");
	var _ = require('underscore');

	var twilioAccountSid = 'AC48de99ab1c557344604f321b13163063';
	var twilioAuthToken = '361fb935d419e47b912c47d622279c8b';
	var twilioPhoneNumber = '+19259058117';
	var secretPasswordToken = 'firstapppasswordtoken';

	var language = "en";
	var languages = ["en", "es", "ja", "kr", "pt-BR"];

	var twilio = require('twilio')(twilioAccountSid, twilioAuthToken);


	function findCampingTripById(campingTripId){
		var findCampingTripQuery = new Parse.Query("CampingTrip")
		findCampingTripQuery.equalTo("objectId", campingTripId)
		return findCampingTripQuery.first()
	}

	function findExpensesByFamilyId(familyId){
		var findExpenseQuery = new Parse.Query("Expense")
		findExpenseQuery.equalTo("objectId",familyId)
		return findExpenseQuery.find()
	}

	function findFamiliesByIds(familyIds){
		var findFamilyQuery = new Parse.Query("Family")
		findFamilyQuery.containedIn("objectId",familyIds)
		return findFamilyQuery.find()
	}

	function firstFamilyById(familyId){
		var findFamilyQuery = new Parse.Query("Family")
		findFamilyQuery.equalTo("objectId",familyId)
		return findFamilyQuery.first()
	}

	function updateFamiliesTotalExpense(familiesList){
		var totalTripExpense = 0 
		var totalTripMembers = 0
		var familyWithTotalMembers = {}

		for (var i = familiesList.length - 1; i >= 0; i--) {
			totalTripExpense = totalTripExpense + familiesList[i].get("totalExpense")
			totalTripMembers = totalTripMembers + familiesList[i].get("memberIds").length
			familyWithTotalMembers[familiesList[i].id] = familiesList[i].get("memberIds").length
		};

		 var perMemberExpense = totalTripExpense / totalTripMembers
			
		_.each(familiesList, function(family) {
			var totalMembersCount = family.get("memberIds").length
			var currentTotalExpense = family.get("totalExpense")
			console.log("familyId - " + family.id)
			console.log("totalMembersCount - " + totalMembersCount)
			console.log("perMemberExpense - " + perMemberExpense)
			console.log("currentTotalExpense - " + currentTotalExpense)
			var newTotalExpense = (totalMembersCount * perMemberExpense) - currentTotalExpense
    		family.set("totalOwedExpense", newTotalExpense)
    	});
    	
    	return Parse.Object.saveAll(familiesList)
	}

	function firstMemberbyId(memberId){
		var firstmemberQuery = new Parse.Query("Member")
		firstmemberQuery.equalTo("objectId",memberId)
		return firstmemberQuery.first()
	}

	function createNewMember(memberParams){
		var Member = Parse.Object.extend("Member")
		var member = new Member()
		member.set("memberName",memberName)
		member.set("familyId",memberParams.familyId)
		member.set("phoneNumber",memberParams.phoneNumber)
		member.set("email",memberParams.email)
		member.set("age",memberParams.age)
		return member.save()
	}

	function addMemberIdToFamily(memberId,familyId){
		firstFamilyById(familyId).then(function(family){
			family.addUnique("memberIds",memberId)
			return family.save()
		});
	}

	Parse.Cloud.define("addNewMember", function(request,response){
		var memberParams = request.params

		var campingTripId = request.params.campingTripId

		var Member = Parse.Object.extend("Member");
		var member = new Member()
		member.set("name",memberParams.memberName)
		member.set("familyId",memberParams.familyId)
		member.set("phoneNumber",memberParams.phoneNumber)
		member.set("email",memberParams.email)
		member.set("age",memberParams.age)
		member.save(null, {
  			success: function(savedMember) {
				firstFamilyById(memberParams.familyId).then(function(family){
					family.addUnique("memberIds",savedMember.id)
					console.log("Family = " + family.id)
					return family.save(null, {
						success: function(savedFamily){
							findCampingTripById(campingTripId).then(function(campingTrip) {
							var families = campingTrip.get("families")
							return findFamiliesByIds(families)
	  					}).then(function(results){
	  						return updateFamiliesTotalExpense(results)
	  					}).then(function(result){
	  						response.success(result)
	  					});
							
						},
						error: function(savedFamily, error){
							console.log("Saved Family = " + error)
						}
					});
				});
  			},
  			error: function(notSavedMember, error) {
    			// Execute any logic that should take place if the save fails.
    			// error is a Parse.Error with an error code and message.
    			console.log('Failed to create new object, with error code: ' + error.message);
  			}
  		});
	});

	Parse.Cloud.define("deleteMember", function(request,response){
		var memberId = request.params.memberId
		var campingTripId = request.params.campingTripId

		firstMemberbyId(memberId).then(function(member){
			member.destroy({
				success: function(deletedMember) {
					firstFamilyById(deletedMember.get("familyId")).then(function(family){
						family.remove("memberIds",deletedMember.id)
						family.save(null, {
							success: function(updatedFamily){
								findCampingTripById(campingTripId).then(function(campingTrip) {
								var families = campingTrip.get("families")
									return findFamiliesByIds(families)
	  							}).then(function(results){
	  								return updateFamiliesTotalExpense(results)
	  							}).then(function(result){
	  								response.success(result)
	  							});
							},
							error: function(updateFamily,error){

							}
						});
					});
				},
				error: function(member, error){
					response.error("Error deleting member : " + member)
				}
			})
		});
	});

	Parse.Cloud.define("addUpdateExpense", function(request,response){
		var expenseName = request.params.expenseName
		var desc = request.params.desc
		var amount = request.params.amount
		var familyId = request.params.familyId
		var campingTripId = request.params.campingTripId

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




