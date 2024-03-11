const cote = require('cote')
const { Sequelize, DataTypes } = require('sequelize')

const myDatabase = new Sequelize('postgres://postgres:whuproject@postgresql:5432')
const ridesModel = require('/models/rides.js')
const rides = ridesModel(myDatabase, DataTypes)

const billingRequester = new cote.Requester({ name: 'billing requester', key: 'billing' })

const passengerResponder = new cote.Responder({ name: 'passenger responder', key: 'passenger' })



passengerResponder.on('create ride', async req => {
    await myDatabase.sync({ force: true })
    const data = { ...req.ride }

    const new_ride = await rides.create({
        name: data[0],
        destination: data[1],
        date: data[2],
        type: data[3],
        status: data[3] === 'Ride Sharing' ? 'Not joined' : 'searching',
        passengers: 1,
        price: 0
    })

    console.log("NEW ID: " + new_ride.id)
    return Promise.resolve(new_ride.id)
})


passengerResponder.on('cancel ride', async req => {
    const ride = await rides.findOne({ where: { id: req.id } })

    ride.destroy()
    return Promise.resolve(0)
})


passengerResponder.on('confirm ride', async req => {
    const ride = await rides.findOne({ where: { id: req.id } })

    await ride.update({ status: 'confirmed' })
    return Promise.resolve(ride.id)
})


passengerResponder.on('get status', async req => {
    const ride = await rides.findOne({ where: { id: req.id } })
    return Promise.resolve(ride.status)
})


passengerResponder.on('get passengers', async req => {
    const ride = await rides.findOne({ where: { id: req.id } })
    return Promise.resolve(ride.passengers)
})


passengerResponder.on('pay', async req => {
    await billingRequester.send({ type: 'send money', id: req.id, amount: req.amount })
    return Promise.resolve(0)
})


//  for Ride Sharing type
passengerResponder.on('search ride', async req => {
    const data = { ...req.ride }
    const searchingRide = await rides.findOne({ where: { destination: data[0], date: data[1], type: 'Ride Sharing', status: 'Not joined', passengers: 1 } })
    console.log("SEARCHING..")
    console.log(searchingRide)
    return Promise.resolve(searchingRide)
})


passengerResponder.on('join ride', async req => {
    const data = { ...req.ride }
    const joiningRide = await rides.findOne({ where: { destination: data[0], date: data[1], type: 'Ride Sharing', status: 'Not joined', passengers: 1 } })
    await joiningRide.update({ passengers: 2 })
    await joiningRide.update({ status: 'searching' })
    return Promise.resolve(joiningRide.id)
})


passengerResponder.on('clear database', async req => {
    await myDatabase.sync({ force: true })
    return Promise.resolve(0)
})