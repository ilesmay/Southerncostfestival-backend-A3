require('dotenv').config();
const express = require('express')
const router = express.Router()
const path = require('path')
const Event = require('../models/Events')
const Utils = require('../utils')

// GET - get all events
router.get('/', (req, res) => {
  Event.find().populate()
    .then(events => {
      if (!events.length) {
        return res.status(404).json({
          message: "No events found"
        })
      }

      console.log(events)
      res.json(events)
    })
    .catch(err => {
      console.log('Error fetching events:', err)
      res.status(500).json({
        message: "Problem getting events"
      })
    })
})

//GET - get event by id
router.get('/:id', Utils.authenticateToken, (req, res) => {
  const eventId = req.params.id

  Event.findById(eventId).populate()
    .then(event => {
      // check event exists
      if (!event) {
        return res.status(404).json({ message: "Event not found"})
      }
      res.json(event)
    })
    .catch(err => {
      console.error(err)
      res.status(500).json({
        message: "Couldn't get event",
        error: err
      })
    })
})

// PUT - update event
router.put('/:id', Utils.authenticateToken, async (req, res) => {
  // Validate request body
  if (!req.body && (!req.files || !req.files.eventimage)) {
    return res.status(400).json({ message: "Event data or image can't be empty" })
  }

  try {
    let updateData = { 
      ...req.body
    }

    if (req.body.eventtag) {
      if (!Array.isArray(req.body.eventtag)) {
        updateData.eventtag = [req.body.eventtag]
      } else {
        updateData.eventtag = req.body.eventtag
      }
    }

    // check if image is included
    if (req.files && req.files.eventimage) {

      // upload new image to s3
      const imageUrl = await new Promise((resolve, reject) => {
        Utils.uploadFileToS3(req.files.eventimage, (url) => {
          if (url) {
            resolve(url)
          } else {
            reject(new Error("Image upload failed"))
          }
        })
      })

      updateData.eventimage = imageUrl
    }

  // Find the event by ID and update it with the new data
  const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true })
    console.log('Request body:', req.body)

  // If the event is not found
  if (!updatedEvent) {
    return res.status(404).json({ message: 'Event not found' })
  }

  // Return the updated event
  res.json(updatedEvent)
} catch (err) {
  console.error('Error updating event:', err)
  res.status(500).json({
    message: 'Problem updating event',
    error: err.message
  })
}
})

// POST - create new Event
router.post('/', async (req, res) => {
  if(!req.body.eventdisplayname || !req.body.vendorcontactemail || !req.body.vendorcontactphone) {
    return res.status(400).send({ message: "Event content cannot be empty" })
  }

  // check image file exists
  if(!req.files || !req.files.eventimage) {
    return res.status(400).send({ message: "Image cannot be empty "})
  }

  Utils.uploadFileToS3(req.files.eventimage, (imageUrl) => {
    // create new Event
    let newEvent = new Event({
      eventdisplayname: req.body.eventdisplayname,
      vendorcontactname: req.body.vendorcontactname,
      vendorcontactemail: req.body.vendorcontactemail,
      vendorcontactphone: req.body.vendorcontactphone,
      eventcategory: req.body.eventcategory,
      eventtag: req.body.eventtag,
      eventsaturdaytime: req.body.eventsaturdaytime,
      eventsundaytime: req.body.eventsundaytime,
      eventstallnumber: req.body.eventstallnumber,
      eventdescription: req.body.eventdescription,
      eventimage: imageUrl,
    })

    newEvent.save()
      .then(event => {
        return res.status(201).json({ event, imageUrl })
      })
      .catch(err => {
        console.error('Error saving Event:', err)
        return res.status(500).send({
          message: "Problem creating Event",
          error: err
        })
      })
    })
})

// DELETE - delete an event
router.delete('/:id', async (req, res) => {
  try {
    const eventId = req.params.id

    const event = await Event.findById(eventId)
    if(!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    if (event.eventimage) {
      await Utils.deleteFileFromS3(event.eventimage)
    }

    await Event.findByIdAndDelete(eventId)
    res.status(200).json({ message: 'Event deleted successfully' })
  } catch (err) {
    console.error('Error deleting event:', err)
    res.status(500).json({ message: 'Failed to delete event' })
  }
})
  
// export
module.exports = router
