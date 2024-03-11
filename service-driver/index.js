const cote = require('cote')
const { Sequelize, DataTypes } = require('sequelize')

const myDatabase = new Sequelize('postgres://postgres:whuproject@postgresql:5432')
const ridesModel = require('/models/rides.js')
const rides = ridesModel(myDatabase, DataTypes)

const billingRequester = new cote.Requester({ name: 'billing requester', key: 'billing' })

const driverResponder = new cote.Responder({ name: 'driver responder', key: 'driver' })



driverResponder.on('show all orders', async req => {
    const searchingOrders = await rides.findAll({ where: { status: 'searching' } })
    return Promise.resolve(searchingOrders)
})


driverResponder.on('take the order', async req => {
    const ride = await rides.findOne({ where: { id: req.id } })
    await ride.update({ status: 'accepted' })
    return Promise.resolve(0)
})


driverResponder.on('start the ride', async req => {
    const ride = await rides.findOne({ where: { id: req.id } })
    await ride.update({ status: 'started' })
    return Promise.resolve(0)
})


driverResponder.on('finish the ride', async req => {
    const ride = await rides.findOne({ where: { id: req.id } })
    await ride.update({ status: 'finished' })
    return Promise.resolve(0)
})


driverResponder.on('earn', async req => {
    const earned = await billingRequester.send({ type: 'receive money', id: req.id })
    return Promise.resolve(earned)
})