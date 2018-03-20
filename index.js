// Required to read the .env file with the CnC credentials
require('dotenv').config()

const express = require('express')
const app = express()
const path = require('path')
const request = require('request')
const fs = require('fs')

// Multer is used to parse multipart requests containing the PDF document with
const multer = require('multer')
// Define the storage for the files being upload.
var storage = multer.memoryStorage()
// Add the middleware to parse multipart forms
var upload = multer({
  storage: storage,
  limits: { fileSize: (1000000 * 10) },
  fileFilter: function (req, file, cb) {
    var filetypes = /pdf/
    var mimetype = filetypes.test(file.mimetype)
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    return cb('Compare and Comply Element Classification only supports a PDF file type', false)
  }
}).single('file')

// This tells Express where the client code is and where to serve it from.
app.use(express.static('client'))

// Implementation of the Element Classification endpoint to receive the uploaded PDF and call the Compare and Comply Service.
app.post('/parse', (req, res, err) => {

  upload(req, res, (err) => {
    // This error is returned when multer filters out the file for some reason
    if (err) {
      res.statusCode = 500
      return res.send({ 'body': err })
    }

    let fileName = req.file.originalname

    // Build the URL with the parameters from Part 1
    var url
    url = 'https://gateway.watsonplatform.net/compare-and-comply-experimental/api' +
      '/v1/parse?version=2017-10-30' +
      '&analyze=true' +
      '&subdomain=contract' +
      '&categorize=true'

    let options = {
      url: url,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'multipart/form-data'
      }
    }

    var parse = request(options, (err, response, body) => {
      res.type('json')
      if (err) {
        return res.send(err)
      }
      if (response.statusCode >= 300) {
        res.statusCode = response.statusCode
        return res.send(response)
      } else {
        return res.send(body)
      }
    }).auth(process.env.CNC_USERNAME, process.env.CNC_PASSWORD, true)

    // Add the upload file as a form parameter to the request.
    let form = parse.form()
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.contentType
    })
  })
})

// This function is called to check whether the service is ready and can talk to the CnC service
app.get('/ready', (req, resp) => {
  if (process.env.CNC_USERNAME && process.env.CNC_PASSWORD) {
    return resp.send({ 'ready': true })
  }
  resp.send({ 'ready': false, 'message': 'Check your credentials in the .env file.  The file can not be found or the values are incorrectly set' })
})

app.listen(3000, () => console.log('App is Listening on port 3000'))