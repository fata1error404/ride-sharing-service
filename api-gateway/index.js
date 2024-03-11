const express = require('express')
const cote = require('cote')  // zero-configuration microservices
const bodyParser = require('body-parser')  // to parse incoming http requests

const fs = require('fs').promises;
const path = require('path')
const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())



// creating requesters for microservices
// (allows microservices to interact with each other)
const passengerRequester = new cote.Requester({ name: 'passenger requester', key: 'passenger' })

const driverRequester = new cote.Requester({ name: 'driver requester', key: 'driver' })


app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '/mainpage.html'))
})



//  PASSENGER MICROSERVICES
app.get('/passenger', async (req, res) => {
    res.sendFile(path.join(__dirname, '/index-passenger.html'))
})


app.post('/passenger', (req, res) => {
    var type

    switch (req.body.ride_type) {
        case 'option1': type = 'Ride Sharing'; break
        case 'option2': type = 'Economy'; break
        case 'option3': type = 'Business'; break
        case 'option4': type = 'Courier'; break
        default: type = 'Unknown'
    }

    if (req.body.ride_type === 'option1')
        res.redirect(`/passenger/search-shared?name=${req.body.name}&destination=${req.body.destination}&date=${req.body.travel_date}&type=${type}`)
    else
        res.redirect(`/passenger/create-normal?name=${req.body.name}&destination=${req.body.destination}&date=${req.body.travel_date}&type=${type}`)
})


app.get('/passenger/create-normal', async (req, res) => {
    const { name, destination, date, type } = req.query
    const id = await passengerRequester.send({ type: 'create ride', ride: [name, destination, date, type] })

    var html = await fs.readFile(path.join(__dirname, '/p-awaiting-driver.html'), 'utf8')
    html = html.replace('<div id="id"> </div>', `<div id="id" hidden> ${id} </div>`)
    html = html.replace('<div id="destination"> </div>', `<div id="destination"> Destination: ${destination} </div>`)
    html = html.replace('<div id="date"> </div>', `<div id="date"> Date: ${date} </div>`)
    html = html.replace('<div id="type"> </div>', `<div id="type"> Type: ${type} </div>`)

    res.send(html)
})


app.post('/passenger/create', async (req, res) => {
    const { id, destination, date, type, passengers } = req.body

    if (req.body.action === 'cancel') {
        await passengerRequester.send({ type: 'cancel ride', id })
        res.redirect('/')
    }
    else if (req.body.action === 'confirm') {
        await passengerRequester.send({ type: 'confirm ride', id })
        res.redirect(`/passenger/start?id=${id}&destination=${destination}&date=${date}&type=${type}&passengers=${passengers}`)
    }
})


app.get('/passenger/search-shared', async (req, res) => {
    const { name, destination, date } = req.query;
    const search_ride = await passengerRequester.send({ type: 'search ride', ride: [destination, date] })

    if (search_ride === null) {
        var html = await fs.readFile(path.join(__dirname, '/p-couldnt-find.html'), 'utf8')
        html = html.replace('<div id="name"> </div>', `<div id="name"> ${name} </div>`)
        html = html.replace('<div id="destination"> </div>', `<div id="destination"> ${destination} </div>`)
        html = html.replace('<div id="date"> </div>', `<div id="date"> ${date} </div>`)

        res.send(html)
    }
    else {
        const id = await passengerRequester.send({ type: 'join ride', ride: [destination, date] })

        var html = await fs.readFile(path.join(__dirname, '/p-awaiting-join.html'), 'utf8')
        html = html.replace('<div id="id"> </div>', `<div id="id" hidden> ${id} </div>`)
        html = html.replace('<div id="destination"> </div>', `<div id="destination"> Destination: ${destination} </div>`)
        html = html.replace('<div id="date"> </div>', `<div id="date"> Date: ${date} </div>`)

        res.send(html)
    }
})


app.get('/passenger/create-shared', async (req, res) => {
    const { name, destination, date } = req.query;

    const id = await passengerRequester.send({ type: 'create ride', ride: [name, destination, date, 'Ride Sharing'] })

    var html = await fs.readFile(path.join(__dirname, '/p-awaiting-join.html'), 'utf8')
    html = html.replace('<div id="id"> </div>', `<div id="id" hidden> ${id} </div>`)
    html = html.replace('<div id="destination"> </div>', `<div id="destination"> Destination: ${destination} </div>`)
    html = html.replace('<div id="date"> </div>', `<div id="date"> Date: ${date} </div>`)

    res.send(html)
})


app.get('/passenger/start', async (req, res) => {
    const { id, destination, date, type, passengers } = req.query

    var html = await fs.readFile(path.join(__dirname, '/p-start-ride.html'), 'utf8')
    html = html.replace('<div id="id"> </div>', `<div id="id" hidden> ${id} </div>`)
    html = html.replace('<div id="destination"> </div>', `<div id="destination"> ${destination} </div>`)
    html = html.replace('<div id="date"> </div>', `<div id="date"> ${date} </div>`)
    html = html.replace('<div id="type"> </div>', `<div id="type"> ${type} </div>`)
    html = html.replace('<div id="passengers"> </div>', `<div id="passengers" hidden> ${passengers} </div>`)

    res.send(html)
})


app.post('/passenger/pay', async (req, res) => {
    console.log("TEST:")
    console.log(req.body.id)
    console.log(req.body.price)
    const result = await passengerRequester.send({ type: 'pay', id: req.body.id, amount: req.body.price })

    res.redirect('/')
})


app.get('/check-status', async (req, res) => {
    const status = await passengerRequester.send({ type: 'get status', id: req.query.id })
    console.log("Status: " + status)

    res.json({ status })
})


app.get('/check-passengers', async (req, res) => {
    const passengers = await passengerRequester.send({ type: 'get passengers', id: req.query.id })
    console.log("Passengers: " + passengers)

    res.json({ passengers })
})



//  DRIVER MICROSERVICES
app.get('/driver', async (req, res) => {
    const availableRides = await driverRequester.send({ type: 'show all orders' })

    var html = await fs.readFile(path.join(__dirname, '/index-driver.html'), 'utf8')

    if (availableRides.length === 0) {
        html = html.replace('<p style="font-size: 1.3rem;"> Available orders </p>', '')
        html = html.replace('<div> To replace </div>', '<div class="text"> No available ride requests at the moment. Please check back later. </div>')
        html = html.replace('<button class="button" type="submit" disabled> Take the order </button>', '')
    }
    else {
        const header =
            `<tr>
            <th> ID </th>
            <th> Name </th>
            <th> Destination </th>
            <th> Date </th>
        </tr>`;

        const rides = availableRides.map(ride =>
            `<tr>
            <td>${ride['id']}</td>
            <td>${ride['name']}</td>
            <td>${ride['destination']}</td>
            <td>${ride['date']}</td>
            <td hidden>${ride['3']}</td>
            <td><input type="checkbox"></td>
        </tr>`).join('');

        html = html.replace('<div> To replace </div>', `<table style="width: 20rem; text-align: left";> ${header} ${rides} </table>`)
    }

    res.send(html)
})


app.post('/driver', async (req, res) => {
    await driverRequester.send({ type: 'take the order', id: req.body.id })

    res.redirect(`/driver/accept?id=${req.body.id}`)
})


app.get('/driver/accept', async (req, res) => {
    var html = await fs.readFile(path.join(__dirname, '/d-ride-accepted.html'), 'utf8')
    html = html.replace('<div id="id"> </div>', `<div id="id" hidden> ${req.query.id} </div>`)

    res.send(html)
})


app.post('/driver/start', async (req, res) => {
    await driverRequester.send({ type: 'start the ride', id: req.body.id })

    var html = await fs.readFile(path.join(__dirname, '/d-ride-started.html'), 'utf8')
    html = html.replace('<div id="id"> </div>', `<div id="id" hidden> ${req.body.id} </div>`)

    res.send(html)
})


app.post('/driver/end', async (req, res) => {
    await driverRequester.send({ type: 'finish the ride', id: req.body.id })

    var html = await fs.readFile(path.join(__dirname, '/d-receive-money.html'), 'utf8')
    html = html.replace('<div id="id"> </div>', `<div id="id" hidden> ${req.body.id} </div>`)

    res.send(html)
})


app.post('/driver/earn', async (req, res) => {
    const earned = await driverRequester.send({ type: 'earn', id: req.body.id })
    res.send(`<script>alert("You earned ${earned} $"); window.location.href = "/";</script>`)
})



// starting the server
passengerRequester.send({ type: 'clear database' }).then(() => {
    app.listen(3000, () => {
        console.log('Server running on port 3000')
    })
})