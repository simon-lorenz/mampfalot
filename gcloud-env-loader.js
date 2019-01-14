'use strict'

/**
 * This file is for deployment purposes only. It helps with secret enviornment
 * variables, because Google App Engine (GAE) seems not to offer a simple,
 * heroku-ish way, to provide environment variables.
 *
 * So, GAE expects all environment variables to be set in app.yaml, which would
 * work, if I would deploy and create the app.yaml manually. However I'm using
 * Travis CI, so I need to commit the app.yaml but of course I don't want to
 * make my database passwords or secret keys open source. :-)
 *
 * This is where this file comes in. I will store all my secret environment
 * variables in a Google Cloud Bucket and this helper will load them
 * automatically.
 *
 * Thanks to http://gunargessner.com/gcloud-env-vars/ for the inspiration.
 *
 */

// Check if we are running in a GAE environment
const service = process.env.GAE_SERVICE

if (service === undefined) {
	console.log('[EnvLoader] No service specified, probably not running in gae environment. Aborting.')
	process.exit()
}

// There are different .env files available, for the production and beta environments.
// We select the right file depending on the service name.
let fileName

switch (service) {
	case 'mampfalot-backend':
		fileName = '.env.production'
		break
	case 'mampfalot-backend-beta':
		fileName = '.env.beta'
		break
	default:
		console.error(`[EnvLoader]: Could not determine which file to download, because service "${service}" is unknown. Aborting.`)
		process.exit()
}

// Connect to the bucket and download the file.
// On Google Cloud Platform authentication is handled for us.
const bucketName = 'environments-mampfalot-backend'
const { Storage } = require('@google-cloud/storage')
const storage = new Storage()
const bucket = storage.bucket(bucketName)
const file =  bucket.file(fileName)

console.log(`[EnvLoader] Downloading "${fileName}" from bucket ${bucketName}`)

file
	.download({ destination: '.env' })
	.then(() => {
		console.log(`[EnvLoader] Download successful. Created .env from ${fileName}`)
	})
	.catch(e => {
		console.error(`[EnvLoader] There was an error: ${JSON.stringify(e)}`)
	})
