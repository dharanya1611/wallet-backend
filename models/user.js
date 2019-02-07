const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    email: {
        type: String,
        required: [true, 'The email is required'],
        unique:true
    },
    firstName: {
        type:String
    },
    lastName: {
        type:String
    },
    password: {
        type:String
    },
    address: {
        type:String,
        required: [true, 'The address is required'],
        unique: true
    },
    country: {
        type:String
    },
    city: {
        type:String
    },
    companyName : {
        type:String
    },
    accountType: {
        type:String
    },
    filename1: {
        type: String
    },
    filename2: {
        type: String
    },
    pincode : {
        type: String
    },
    physicaladdress: {
        type: String
    },
    phoneNumber: {
        type:String
    },
    idProoftype : {
        type: String
    },
    addproofType : {
        type: String
    },
    addproofTypefile : {
        type: String
    },
    idProoftypefile : {
        type: String
    },
    addproofDocNo : {
        type: String
    },
    idproofDocNo : {
        type: String
    },
    seed: {
        type:String
    },
    created: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'Active'
    },
    limit: {
        type: Number,
    },
    kycStatus: {
        type: String,
    },
    companyCrn: {
        type: String,
    },
    // companyOrigin: {
    //     type: String,  
    // },
    temporaryPassword: {
        type: String,
    },
    apiKey: {type: String},
    role: {
        type: String,
        default: 'Normal'
    },
    company: [{
        type:Schema.Types.ObjectId, ref: 'User'
    }]
    
});

 module.exports = mongoose.model('User', userSchema);

/**
 * Compare the passed password with the value in the database. A model method.
 *
 * @param {string} password
 * @returns {object} callback
 */
userSchema.methods.comparePassword = function comparePassword(password, callback) {
    bcrypt.compare(password, this.password, callback);
};


/**
 * The pre-save hook method.
 */
userSchema.pre('save',function(next) {
    const user = this;

    // proceed further only if the password is modified or the user is new
    if (!user.isModified('password')) return next();
    // if (!user.isModified('password') && !user.isModified('temporaryPassword')) return next();

   if(user.isModified('password')){
    return bcrypt.genSalt((saltError, salt) => {
        if (saltError) { return next(saltError); }

        return bcrypt.hash(user.password, salt, (hashError, hash) => {
            if (hashError) { return next(hashError); }

            // replace a password string with hash value
            user.password = hash;

            return next();
        });
    });
   }
//    if(user.isModified('temporaryPassword')){
//     return bcrypt.genSalt((saltError, salt) => {
//         if (saltError) { return next(saltError); }

//         return bcrypt.hash(user.temporaryPassword, salt, (hashError, hash) => {
//             if (hashError) { return next(hashError); }

//             // replace a temporaryPassword string with hash value
//             user.temporaryPassword = hash;

//             return next();
//         });
//     });
//    }
});