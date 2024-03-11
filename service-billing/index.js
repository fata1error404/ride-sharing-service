const cote = require('cote')
const { Sequelize, DataTypes } = require('sequelize')

const myDatabase = new Sequelize('postgres://postgres:whuproject@postgresql:5432')
const ridesModel = require('/models/rides.js')
const rides = ridesModel(myDatabase, DataTypes)

const billingResponder = new cote.Responder({ name: 'billing responder', key: 'billing' })



billingResponder.on('send money', async req => {
    const ride = await rides.findOne({ where: { id: req.id } })
    await ride.update({ price: req.amount })
    await ride.update({ status: 'paid' })

    return Promise.resolve(0)
})


billingResponder.on('receive money', async req => {
    const ride = await rides.findOne({ where: { id: req.id } })

    return Promise.resolve(ride.price)
})
