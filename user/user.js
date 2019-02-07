const config = require('config');
const verify = require('../middleware/verify');
const User = require('../models/user');
const Card = require('../models/card');
const Transaction = require('../models/transaction');
const lightwallet = require("eth-lightwallet");
const encrypt = require('../utils/crypto');
const upload = require('../utils/utils');
const provider =   config.get('etheriumhost'); 
const web3 = require('../utils/web3.singleton')(`${provider}`);
const Campaign =  require('../models/campaign');
const walletUtils= require('../utils/wallet');
const tokenOneAbi = config.get('indabi');
const Tx = require('ethereumjs-tx');
var jwt = require('jsonwebtoken'); 
var keygen = require("keygenerator");

function createToken(user, res) {
    return jwt.sign(user, config.secret, {
        expiresIn:86400
    })
}

function decryptSeed (seed, password) {
    const encrypt = require('../utils/crypto');
    return encrypt.decrypt('aes256',password,seed)
}
function encryptSeed(seed, password) {
    return encrypt.encrypt('aes256', password, seed.toString());
}

function checkhex (word) {
    console.log('before add', word)
    if(word.length % 2 != 0){
        let  w1 = word.substring(0, 2);
        let w2 = word.substring(2, word.length);
        return w1+'0'+w2;
    }else{
        return word;
    }
}

const icontractAddress = config.get('indcontractAddress');
const inContract =  web3.eth.contract(tokenOneAbi).at(icontractAddress)

const arrayToObject = (array) =>
array.reduce((obj, item) => {
obj[item.address] = item
return obj
}, {})


module.exports = function(router) {
    router.get('/user',
        verify,
        (req, res) => {
            const { user } = req;
            User.findOne({"address":user.address})
            .then(
                userDetails => {
                    if(!userDetails){
                        return res.json({ message: 'User Not found', status: 401, type: 'Failure' })
                    }
                    return res.json({data:userDetails, status:200, type:'Success' } )
                    console.log(userDetails)
                },
                err =>{
                    return res.json({ message: 'User details cannot find . please try again later', status: 500, type: 'Failure'})
                }
            )
        }
    );

    router.get('/cardList',  
        verify,
        (req, res) => {  
            // User.find({accountType: {$ne: "company"} })
            Card.find()
            .populate('user')
                .then( 
                    doc => {
                        if(!doc) {
                            return res.json ({message: "Cannot find card details", status:400, type: "Failure"})
                        }
                        return res.json({data:doc, status:200, type:"Success"})
                    },  
                    err => {
                        return res.json({message: 'User list not found', status:401, type:"Failure"})
                    }
                )
        }
    )

    router.get('/userList',  
        verify,
        (req, res) => {  
            // User.find({accountType: {$ne: "company"} })
            User.find({})
                .then( 
                    doc => {
                        if(!doc) {
                            return res.json ({message: "Cannot find user details", status:400, type: "Failure"})
                        }
                        return res.json({data:doc, status:200, type:"Success"})
                    },  
                    err => {
                        return res.json({message: 'User list not found', status:401, type:"Failure"})
                    }
                )
        }
    )

    router.post('/makeActiveUser/:userid',
    verify,
    (req, res) => {
        const { userid } = req.params;
        const {user} = req;

        User.findById(userid)
    .then(
        dbres => {
            if(!dbres) {
                return res.json({ message: "cannot find user details", status:401, type:'Failure' })
            };
            User.findOneAndUpdate({_id:dbres._id},{'User':user.address, 'status':'Active'})
            .then( users => {
                return res.json({ message:'User is activated', status:200, type:'Success'})
            },
            err => {
                return res.json({ message: "User is not activated", status:400, type:'Failure' })
            })
            //transaction function
        },
        err =>{
            return res.json({ message: 'Cannot process your request. Try after some time', status: 500, type: 'Failure'})
        }
    )
 })

 router.post('/inActiveUser/:userid',
    verify,
    (req, res) => {
        const { userid } = req.params;
        const {user} = req;

        User.findById(userid)
    .then(
        dbres => {
            if(!dbres) {
                return res.json({ message: "cannot find user details", status:401, type:'Failure' })
            };
            User.findOneAndUpdate({_id:dbres._id},{'User':user.address, 'status':'Inactive'})
            .then( users => {
                return res.json({ message:'User is inactive', status:200, type:'Success'})
            },
            err => {
                return res.json({ message: "User status not known", status:400, type:'Failure' })
            })
            //transaction function
        },
        err =>{
            return res.json({ message: 'Cannot process your request. Try after some time', status: 500, type: 'Failure'})
        }
    )
 })
            
    
        router.post('/suspendUser/:userid', 
        verify,
        (req, res) => {
            const { userid } = req.params;
            const {user} = req;

            User.findById(userid)
        .then(
            dbres => {
                if(!dbres) {
                    return res.json({ message: "cannot find user details", status:401, type:'Failure' })
                };
                User.findOneAndUpdate({_id:dbres._id},{'User':user.address, 'status':'Suspended'})
                .then( users => {
                    return res.json({ message:'User is suspended', status:200, type:'Success'})
                },
                err => {
                    return res.json({ message: "User is not suspended", status:400, type:'Failure' })
                })
                //transaction function
            },
            err =>{
                return res.json({ message: 'Cannot process your request. Try after some time', status: 500, type: 'Failure'})
            }
        )
        })       
        
        router.post('/rejectKyc/:id', 
        verify,
        (req, res) => {
            const { id } = req.params;
            const {user} = req;

            User.findById(id)
        .then(
            dbres => {
                if(!dbres) {
                    return res.json({ message: "cannot find details", status:401, type:'Failure' })
                };
                User.findOneAndUpdate({_id:dbres._id},{'User':user.address, 'kycStatus':'Rejected'})
                .then( users => {
                    return res.json({ message:'KYC is rejected', status:200, type:'Success'})
                },
                err => {
                    return res.json({ message: "KYC is not rejected", status:400, type:'Failure' })
                })
                //transaction function
            },
            err =>{
                return res.json({ message: 'Cannot process your request. Try after some time', status: 500, type: 'Failure'})
            }
        )
        })       

        router.post('/approveKyc/:id', 
        verify,
        (req, res) => {
            const { id } = req.params;
            const {user} = req;

            User.findById(id)
        .then(
            dbres => {
                if(!dbres) {
                    return res.json({ message: "cannot find details", status:401, type:'Failure' })
                };
                User.findOneAndUpdate({_id:dbres._id},{'User':user.address, 'kycStatus':'Approved'})
                .then( users => {
                    return res.json({ message:'KYC is approved', status:200, type:'Success'})
                },
                err => {
                    return res.json({ message: "KYC is not approved", status:400, type:'Failure' })
                })
                //transaction function
            },
            err =>{
                return res.json({ message: 'Cannot process your request. Try after some time', status: 500, type: 'Failure'})
            }
        )
        })       
        

    router.get('/balance',
        verify,
        (req, res) => {
            const { user} = req;
            let balance;
            try{
                 balance = inContract.balanceOf(user.address);
            }catch(e) {
                console.log("err",e)
                return res.json({message: 'Cannot get user balance', status: 400, type: "Failure"})
            }
            balance = balance ? balance/1e18:0
            return res.json({data: balance, status: 200, type:"Suucess"})
        }
    )

    router.post('/edituser',
        verify,
        upload.any(),
        (req, res) =>{
            const { user } = req;
            const userUpdateDetails = req.body;
            if(userUpdateDetails.fieldname1) {
                userUpdateDetails.filename1 = req.files[0].filename
            }
            if(userUpdateDetails.fieldname2 && userUpdateDetails.fieldname1){
                userUpdateDetails.filename2 = req.files[1].filename;
            }
            // if(userUpdateDetails.filename2 && !userUpdateDetails.fieldname1) {
            //     userUpdateDetails.filename2 = req.files[0].filename;
            // }
            if('fieldname1' in req.body){
                delete userUpdateDetails.fieldname1
            }
            if('fieldname2' in req.body){
                delete userUpdateDetails.fieldname2
            }
            User.findOne({"address":user.address})
            .then(
                userDetails => {
                    if(!userDetails){
                        return res.json({ message: 'User Not found', status: 401, type: 'Failure' })
                    }
                    User.findOneAndUpdate({"address":user.address},userUpdateDetails)
                        .then( doc => {
                            return res.json({ message: "User details updated successfully.", status: 200, type:'Success' })
                        },
                        err => {
                            return res.json({ message: 'User details cannot update. please try again later', status: 500, type: 'Failure'})
                        })
                },
                err =>{
                    return res.json({ message: 'User details cannot find . please try again later', status: 500, type: 'Failure'})
                }
            )
        }
    )

    router.get('/user/:userId',
        verify,
        (req, res) => {
            const { userId}  = req.params
            User.findById(userId)
            .then(
                doc => {
                    if(!doc) {
                        return res.json({message: "Cannot find user details", status: '204', type: 'Failure'})
                    }
                    res.json({data: doc, status: 200, type: 'Success'})
                },
                err => {
                    return res.json({message: 'Cannot find user details. Try after sometime', status:500, type: 'Failure'})
                }
            )
        }
    )

    router.post('/updateUser/:userId',
        verify,
        (req, res) => {
            const { userId } = req.params;
            const requireParams = [
                'firstName',
                'lastName',
                // 'limit',
                'country',
                // 'companyName',
                'physicaladdress',
                'phoneNumber'
            ]; 
            let userdata = req.body
            if(req.file) {
                userdata.userImage = req.file.filename
            }
            let isValid =  requireParams.reduce((acc, p) => (  acc & p in req.body), true)
            if(!isValid) {
                return res.json({message: 'A require Param is not present ', status: 400, type: 'Failure'});
            }
            User.findById(userId)
            .then( doc => {
                if(!doc) {
                    return res.json({message: "Cannot find campaign details", status: '204', type: 'Failure'})
                }
                User.findByIdAndUpdate(userId, userdata)
                .then( saveres => {
                    console.log("res",saveres)
                    return res.json({data:saveres, status: 200, type: 'Success'})
                },
                err => {
                    return res.json({message: 'Cannot update user details. Try after sometime', status:500, type: 'Failure'})
                })
            },
            err => {
                return res.json({message: 'Cannot update user details. Try after sometime', status:500, type: 'Failure'})
            })
        }
    )

    router.post('/saveCompany/:userId',
        verify,
        (req, res) => {
            const { userId } = req.params;
            const requireParams = [
                'companyName',
                'companyCrn',
                'country',
                'physicaladdress',
                'phoneNumber'
            ]; 
            let userdata = req.body
            if(req.file) {
                userdata.userImage = req.file.filename
            }
            let isValid =  requireParams.reduce((acc, p) => (  acc & p in req.body), true)
            if(!isValid) {
                return res.json({message: 'A require Param is not present ', status: 400, type: 'Failure'});
            }
            User.findById(userId)
            .then( doc => {
                if(!doc) {
                    return res.json({message: "Cannot find campaign details", status: '204', type: 'Failure'})
                }
                User.findByIdAndUpdate(userId, userdata)
                .then( saveres => {
                    console.log("res",saveres)
                    return res.json({data:saveres, status: 200, type: 'Success'})
                },
                err => {
                    return res.json({message: 'Cannot update user details. Try after sometime', status:500, type: 'Failure'})
                })
            },
            err => {
                return res.json({message: 'Cannot update user details. Try after sometime', status:500, type: 'Failure'})
            })
        }
    )

    router.post('/transfer',
        verify,
        (req, res, next) => {
            const requireParams = [
                'from',
                'to',
                'value',
                'company',
                'password',
                // 'firstName',
                // 'lastName'
            ]; 
            console.log(req.body)
            let isValid =  requireParams.reduce((acc, p) => (  acc & p in req.body), true)
            if(!isValid) {
                return res.json({message: 'A require Param is not present ', status: 400, type: 'Failure'});
            }
            const { user } = req;
            if(user.address !== req.body.from) {
                return res.json({message: 'invalid from address', status: 400, type: 'Failure'});
            }
            if(user.phrase !== req.body.password) {
                return res.json({message: 'Invalid password', status:401, type: 'Failure'})
            }
            User.findById(req.body.company)
            .then (
                tcamp => {
                    if(!tcamp){
                        return res.json({message:'Transfer details are invalid', status: 400, type:'Failure'})
                    }
                    // if(tcamp.value != req.body.value) {
                    //     return res.json({message: 'transfer amount is mismatch', status:400, type:'Failure'})
                    // }
                    next()
                },
                err => {
                    return res.json({message: 'Cannot find the campaign details', status: 400, type:'Failure'})
                }
            )
            
        },
        (req, res) => {
            let { from, to, value:amount, company, password} = req.body;
            const { user } = req;
            let balance;
            try{
                 balance = inContract.balanceOf(user.address);
                 balance = balance ? balance/1e18:0
                 console.log("BALANCE",balance)
                 console.log("AMOUNT",amount)
            }catch(e) {
                return res.json({message: 'Cannot get user balance', status: 400, type: "Failure"})
            }
            if(balance <  amount) {
                return res.json({message: 'Insufficient balance', status: 400, type:'Failure'})
            }
            const {address, seed, phrase} = user;
            const seedw = decryptSeed(seed, phrase);
            const wallet = walletUtils.getWallet(seedw);
            const skey = walletUtils.getWalletPrivateKey(wallet)
            amount= amount * 1e18;
            const secret = new Buffer(skey, 'hex');
            const rawTransaction = {
                "nonce": checkhex(web3.toHex(web3.eth.getTransactionCount(address))),
                "gasPrice": 0,
                "gasLimit": "0x0153df",
                "to": icontractAddress,
                "value": '0x00',
                data : inContract.transfer.getData(to, amount, {from: address})
            }
            const tx = new Tx(rawTransaction);
            tx.sign(secret);
            const serializedTx = tx.serialize();
            let sendString = serializedTx.toString('hex');
            web3.eth.sendRawTransaction(`0x${sendString}`,
                function(err, result) {
                    if(!err) {
                        let txhash = result;
                        let newTransaction = new Transaction({
                            hash: result,
                            from: address,
                            nonce: web3.eth.getTransactionCount(address),
                            to,
                            value: amount / 1e18,
                            timestamp: Date.now(),
                            company:company
                        })
                        newTransaction.save((err, result) => {
                            User.findByIdAndUpdate(company, {txhash})
                            .then(
                                doccam => {
                                    return res.json({status: 'Success', status: 200, type:'Success'})
                                },
                                err => {
                                    return res.json({message: 'Cannot find the campaign details', status: 400, type:'Failure'})
                                }
                            )
                        })
                    }else{
                        console.log("err",err)
                        return res.json({message: 'Cannot find the campaign details', status: 400, type:'Failure'})
                    }
                }
            )

        }
    )

    router.post('/addCompany',
    (req, res, next) => {
     const requireParams = [
        'email',
        'companyCrn',
        'country',
        'companyName',
        'phoneNumber',
        'accountType',
        'password'
        ];
        console.log('helooo',req.body)
        let isValid = requireParams.reduce((acc, p) => ( acc & p in req.body), true)
        if(!isValid) {
        return res.json({message: 'A require Param is not present ', status: 400, type: 'Failure'});
        };
       
        
            req.body.email = req.body.email.toLowerCase();
            const {email,accountType,companyCrn,country,companyName,phoneNumber,password,physicaladdress} = req.body;
            // console.log('hgfsggh',req.body)
            User.findOne({'email':req.body.email})
            .then(
                user => {
                    if(user){
                        return res.json({ message: 'This Email already Exists.', status: 400, type: "Failure"})
                    }else{
                        const seed  = lightwallet.keystore.generateRandomSeed();
                        const wallet = walletUtils.getWallet(seed);
                        const seedHash = encryptSeed(seed, password);
                        const address =walletUtils.getWalletAddress(wallet)
                        const apiKey = keygen._();
                        console.log("api",apiKey)
                        // var keygen = require("keygenerator");
                        
                        const user = new User({
                            email,
                            password,
                            address,
                            seed:seedHash,
                            accountType,
                            companyCrn, 
                            country, 
                            companyName, 
                            phoneNumber,
                            physicaladdress,
                            apiKey
                        })
                        const data = {
                            address,
                            pubkey: walletUtils.getWalletPublicKey(wallet),
                            seed:seedHash,
                            accountType,
                            apiKey
                        };
                        user.save()
                        .then( result => {
                                token = createToken({address: data.address, seed: seedHash, phrase:password, accountType}, res);
                                // res.json({data, token, seed,  status: 200, type: 'Success'});
                                res.json({data, status:200, type: 'Success'})
                            },err=>{
                                res.json({message: err, status: 400, type: "Failure"})
                            }
                        )
                    }
                },
                err =>{
                    res.json({message: err, status: 500, type: "Failure"})
                }
            )
        },
    )

router.get('/companyList',
        verify,
        (req, res) => {
            // User.find({_id: ""})
            User.find({accountType: "Company"})
            .then( 
                result => {
                    return res.json({data:result, status:200, type:"Success"})
                },
                err => {
                    return res.json({message: 'Company list not found', status:401, type:"Failure"})
                }
            )
        })

    router.get('/company/:id',
        verify,
        (req, res) => {
            const { id}  = req.params
            // User.findById(id).lean()
            // .populate('company')
             User.findById(id)
            .then(
                doc => {
                    if(!doc) {
                        return res.json({message: "Cannot find company details", status: '204', type: 'Failure'})
                    }
                    res.json({data: doc, status: 200, type: 'Success'})
                },
                err => {
                    return res.json({message: 'Cannot find company details. Try after sometime', status:500, type: 'Failure'})
                }
            )
        })

    router.post('/updateCompany/:id',
        verify,
        (req, res) => {
            const { id } = req.params;
            const requireParams = [
                'physicaladdress',
                'country',
                'phoneNumber',
                'companyName',
                'companyCrn'
            ]; 
            let userdata = req.body
            if(req.file) {
                userdata.userImage = req.file.filename
            }
            let isValid =  requireParams.reduce((acc, p) => (  acc & p in req.body), true)
            if(!isValid) {
                return res.json({message: 'A require Param is not present ', status: 400, type: 'Failure'});
            }
            User.findById(id)
            .then( doc => {
                if(!doc) {
                    return res.json({message: "Cannot find company details", status: '204', type: 'Failure'})
                }
                User.findByIdAndUpdate(id, userdata)
                .then( saveres => {
                    console.log("res",saveres)
                    return res.json({data:saveres, status: 200, type: 'Success'})
                },
                err => {
                    return res.json({message: 'Cannot update company details. Try after sometime', status:500, type: 'Failure'})
                })
            },
            err => {
                return res.json({message: 'Cannot update company details. Try after sometime', status:500, type: 'Failure'})
            })
        })

    router.get('/companyUserlist',
        verify,
        (req, res) => {
            let user = req.user;
            if(user.accountType !== "Company") {
                return res.json({ message: 'Company Userlist cannot be found. please try again later', status: 500, type: 'Failure'})
            }
            else{
            User.findOne({address: user.address})
            .then(
                userList => {
                    if(!userList){
                        return res.json({ message: 'Company Userlist Not found', status: 401, type: 'Failure' })
                    }
                    // return res.json({data:userList, status:200, type:'Success' } )
                    console.log(userList)
                    User.find({company: userList._id})
                        .then(
                            result => {
                                return res.json({data:result, status:200, type:"Success"})
                            },
                            err => {
                                return res.json({message: 'Cannot find company Userlist. Try after sometime', status:500, type: 'Failure'})
                            })                  
            },
            err => {
                return res.json({message: 'Cannot access company Userlist', status:500, type: 'Failure'})
            }

        )}    
    })

    // router.get('/transaction',
    // verify,
    // (req, res) => {
    //     const { user } = req;
    //     // User.find({accountType: {$ne: "company"} })
    //     // User.find({from: {$eq: user.address}})
    //      User.findOne({"address":user.address})
    //     .then(
    //         userDetails => {
    //             if(!userDetails){
    //                 return res.json({ message: 'Transaction Not found', status: 401, type: 'Failure' })
    //             }
    //             // Transaction.find({from: {$eq: user.address}})
    //             Transaction.find( { $or: [ { from: { $eq: user.address}}, {to: { $eq: user.address}} ] } )
    //             .then( 
    //                 doc => {
    //                     console.log(doc)
    //                     return res.json({data:doc, status:200, type:'Success' } )
                    
    //                 })              
    //         },
    //         err =>{
    //             return res.json({ message: 'transaction details cannot be found . please try again later', status: 500, type: 'Failure'})
    //         }
    //     )
    // })
    
    router.get('/transactions',
    verify,
    (req, res) => {
        const { user } = req;
        // User.find({accountType: {$ne: "company"} })
        // User.find({from: {$eq: user.address}})
         User.findOne({"address":user.address})
        .then(
            userDetails => {
                if(!userDetails){
                    return res.json({ message: 'Transaction Not found', status: 401, type: 'Failure' })
                }
                Transaction.find( { $or: [ { from: { $eq: user.address}}, {to: { $eq: user.address}} ] } )
                .then( 
                    doc => {
                        console.log(doc)
                        return res.json({data:doc, status:200, type:'Success' } )
                    
                    })              
            },
            err =>{
                return res.json({ message: 'transaction details cannot be found . please try again later', status: 500, type: 'Failure'})
            }
        )
    })


    router.get('/userData',  
        verify,
        (req, res) => {  
            User.find({})
            .then( 
                result => {
                    let modifiedarr = arrayToObject(result)
                    return res.json({data:modifiedarr, status:200, type:"Success"})
                },
                err => {
                    console.log(err)
                    return res.json({message: 'User list not found', status:401, type:"Failure"})
                }
            )
        }
    )

    // router.post('/request/:userId',
    //     verify,
    //     (req, res) => {
    //         const { userId } = req.params;
    //         const requireParams = [
    //             'cardRequested',
    //             'encryptedpkey'
    //         ]; 
    //         let userdata = req.body
    //         let isValid = requireParams.reduce((acc, p) => ( acc & p in req.body), true)
    //             if(!isValid) {
    //                 return res.json({message: 'A require Param is not present ', status: 400, type: 'Failure'});
    //             }
    //         User.findById(userId)
    //             .then( doc => {
    //                 if(!doc) {
    //                     return res.json({message: "Cannot find user details", status: '204', type: 'Failure'})
    //                 }
    //             User.findByIdAndUpdate(userId, userdata)
    //                 .then( saveres => {
    //                     console.log("res",saveres)
    //                         return res.json({data:saveres, status: 200, type: 'Success'})
    //                     },
    //                 err => {
    //                     return res.json({message: 'Cannot update user details. Try after sometime', status:500, type: 'Failure'})
    //                 })
    //             },
    //             err => {
    //                 return res.json({message: 'Cannot update user details. Try after sometime', status:500, type: 'Failure'})
    //             })
    //         }
    //     )
         
     
        router.post('/delivered/:userId',
            verify,
            (req, res) => {
                const { userId } = req.params;
                const requireParams = [
                    'status'
                ]; 
                let userdata = req.body
                let isValid =  requireParams.reduce((acc, p) => (  acc & p in req.body), true)
                if(!isValid) {
                    return res.json({message: 'A require Param is not present ', status: 400, type: 'Failure'});
                }
              
                
                    Card.findByIdAndUpdate(userId, userdata)
                    .then( saveres => {
                        console.log("res",saveres)
                        return res.json({data:saveres, status: 200, type: 'Success'})
                    },
                    err => {
                        return res.json({message: 'Cannot update user details. Try after sometime', status:500, type: 'Failure'})
                    })
               
                }
        )

    router.get('/recentTrans',
        verify,
        (req, res) => {
            const { user } = req;
                    // var q={from:"0x802b9c34f4714c67bdcb45eff4240befed7579d6"}

                    Transaction.find( { $or: [ { from: { $eq: user.address}}, {to: { $eq: user.address}} ] } ).sort({_id: -1}).limit(10).exec (function (err,post) {
                    return res.json({data: post, status:200, type:"success"})  
                }
            )
        }
    )     

    router.post('/deleteUser/:id',
        verify,
        (req, res) => {
            const { user } = req;
            const { id } = req.params;
            console.log('userrrr',req.body)
            User.findByIdAndDelete(id)
            .then(
                userDetails => {
                if(!userDetails){
                    return res.json({ message: 'User Not deleted', status: 401, type: 'Failure' })
                }
                return res.json({data:userDetails, status:200, type:'Success' } )
                
            },
                err =>{
                    return res.json({ message: 'User details cannot find . please try again later', status: 500, type: 'Failure'})
                })
            });

            router.get('/balance/:id',
            verify,
            (req, res) => {
                const { user} = req;
                const { id } = req.params;
                let balance;
                User.findById(id)
                .then(doc => {
                   balance = inContract.balanceOf(doc.address);
                 
                  balance = balance ? balance/1e18:0
                return res.json({data: balance, status: 200, type:"Suucess"})
                })
            }
        )
       
    router.get('/userTrans/:id',
    verify,
    (req, res) => {
        const { user} = req;
        //console.log('ghgh',req)
        const { id } = req.params;
        User.findById(id)
        .then(doc => {
            // console.log('two',doc)
            Transaction.find( { $or: [ { from: { $eq: doc.address}}, {to: { $eq: doc.address}} ] } ).exec (function (err,post) {
                // console.log('3',post)
                return res.json({data: post, status:200, type:"success"})
        })
    })
})

    router.get('/admin',
    verify,
    (req, res) => {
        const { user } = req;
        User.find({role: { $eq: 'admin'}})
            .then(
                userDetails => {
                    if(!userDetails){
                        return res.json({ message: 'Admin Not found', status: 401, type: 'Failure' })
                        }
                      return res.json({data:userDetails, status:200, type:'Success' } )
                    },
            err =>{
                return res.json({ message: 'User details cannot find . please try again later', status: 500, type: 'Failure'})
            })
    });

    router.post('/makeadmin/:id',
    verify,
    (req, res) => {
        const data = {}
        data.role = req.body.role
        if(req.user.phrase === req.body.password) {
            User.findByIdAndUpdate(req.params.id,data)
                .then(doc => {
                    if(!doc) {
                        return res.json({message: 'Cannot update user details. Try after sometime', status:500, type: 'Failure'})
                    }
                        return res.json({data: doc, status: 200, type:"Success"})
                    },
                err => {
                    return res.json({message: 'Cannot update user details. Try after sometime', status:500, type: 'Failure'})
                }) 
        }
        else {
            return res.json({message: 'Wrong Password', status:500, type: 'Failure'})
        }           
    })
     
    router.post('/userSearch',
    verify,
    (req, res) => {
        const { userId } = req.params;
        User.findOne({'email':req.body.email})
            .then( saveres => {
                return res.json({data:saveres, status: 200, type: 'Success'})
            },
        err => {
            return res.json({message: 'Cannot update user details. Try after sometime', status:500, type: 'Failure'})
        })
    })


    router.post('/changeadmin/:id',
    verify,
    (req, res) => {
        User.findByIdAndUpdate(req.params.id,req.body)
            .then(doc => {
                if(!doc) {
                    return res.json({message: 'Cannot update user details. Try after sometime', status:500, type: 'Failure'})
                }
             return res.json({data: doc, status: 200, type:"Success"})
            },
        err => {
            return res.json({message: 'Cannot update user details. Try after sometime', status:500, type: 'Failure'})
        })
    })        
   
}