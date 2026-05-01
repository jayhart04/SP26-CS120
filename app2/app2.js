import http from 'node:http';
import { MongoClient } from 'mongodb';

const port = process.env.PORT || 3000;
const uri =
  'mongodb+srv://jahart04:password!@test.07qttlu.mongodb.net/?retryWrites=true&w=majority&appName=test';
const client = new MongoClient(uri);

await client.connect();
console.log('Connected to MongoDB');

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'text/html');

  if (req.method === 'GET' && req.url === '/') {
    res.write('<h2>Home</h2>');
    res.write("<form method='post' action='/process'>");
    res.write("<input type='text' name='place_zipcode' placeholder='Enter place or zipcode' required>");
    res.write("<input type='submit' value='Submit'>");
    res.write('</form>');
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/process') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const form = new URLSearchParams(body);
        const userInput = (form.get('place_zipcode') || '').trim();

        if (!userInput) {
          res.end('<h2>Process</h2><p>Please enter a place or zipcode.</p>');
          return;
        }

        const isZip = /^[0-9]/.test(userInput);
        let result;

        if (isZip) {
          result = await client.db('cs120-test').collection('places').findOne({ zipcodes: userInput });
          console.log('Input Zipcode:', userInput);
        } else {
          result = await client.db('cs120-test').collection('places').findOne({ name: userInput });
          console.log('Input Place:', userInput);
        }
        console.log('Place Found:', result);
        

        res.write('<h2>Process</h2>');
        if (!result) {
          res.write('<p>No matching place/zipcode found.</p>');
        } else {
          res.write(`<p>Place: ${result.name}</p>`);
          res.write(`<p>Zipcodes: ${result.zipcodes.join(', ')}</p>`);
        }
        res.end();
      } catch (err) {
        console.error('Process error:', err);
        res.end('<h2>Process</h2><p>Server error while processing request.</p>');
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end('<h2>404</h2><p>Page not found.</p>');
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});