const Coupon =  require('../models/coupon');
const verify = require('../middleware/verify');
const Supply = require('../models/supply');

module.exports = function(router) {
    router.post('/addcash',
        verify,
        (req, res) => {
            const { user } = req;
            const requireParams = [
                'symbol',
                'description',
                'name',
                'totalSupply',
                'active'
            ];
            console.log(req.body.active)
            console.log(req.body)
            let isValid =  requireParams.reduce((acc, p) => (  acc & p in req.body), true)
            if(!isValid) {
                return res.json({message: 'A require Param is not present ', status: 400, type: 'Failure'});
            };
            const {symbol, description, totalSupply, name, active} = req.body
            const newcoupon = new Coupon({
              symbol,
              description,
              totalSupply,
              name,
              active
            });
           
            newcoupon.save()
            .then(
                doc => {
                    return res.json({message: 'e-cash added successfully', status: 200, type: 'Success'})
                },
                err => {
                    // return res.json({message: 'Cannot save e-cash details. Try after sometime', status:500, type: 'Failure'})
                    console.log(err)
                }
            )
        }
    );

        router.get('/ecash',
            verify,
                (req, res) => {
                    // User.find({_id: ""})
                    Coupon.find({active: "y"})
                    .then( 
                        result => {
                            return res.json({data:result, status:200, type:"Success"})
                        },
                        err => {
                            return res.json({message: 'Ecash list not found', status:401, type:"Failure"})
                        }
                    )
            })

            router.get('/ecash/:id',
                verify,
                (req, res) => {
                    const id = req.params.id;
                    Coupon.findById(id)
                     .then( 
                        result => {
                            return res.json({data:result, status:200, type:"Success"})
                        },
                    err => {
                        return res.json({message: 'Ecash not found', status:401, type:"Failure"})
                    })
                })       

            router.get('/supply',
            verify,
            (req, res) => {
              Supply.find()
                .then( 
                    result => {
                        return res.json({data:result, status:200, type:"Success"})
                    },
                    err => {
                        return res.json({message: 'Ecash list not found', status:401, type:"Failure"})
                    })
            })

            router.post('/addSupply/:id',
            verify,
            (req, res) => {
                const id = req.params.id;
                console.log(req.params.id)
                let cashdata = req.body
                console.log('jhkjhk',req.body)
                Coupon.findById(id)
                    .then( doc => {
                        if(!doc) {
                            return res.json({message: "Cannot find camapign details", status: '204', type: 'Failure'})
                        }
                        Coupon.findByIdAndUpdate(id, cashdata)
                        .then( saveres => {
                            const {user, value} = req.body
                            const newsupply = new Supply({
                                Date,
                                user,
                                value
                              });
                              newsupply.save()
                              .then(response => {
                                  return res.json({message: 'Supply added Succefsully' ,status: '200', type: 'Success'})
                              })
                            return res.json({data:saveres, status: 200, type: 'Success'})
                        },
                        err => {
                            return res.json({message: 'Cannot update campaign details. Try after sometime', status:500, type: 'Failure'})
                        })
                    },
                    err => {
                        return res.json({message: 'Cannot update campaign details. Try after sometime', status:500, type: 'Failure'})
                        console.log(err)
                    })
                })    
                  
    }