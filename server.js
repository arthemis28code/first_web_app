import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const CONTENT_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const TREASURES = [
  {
    id: 'acqua-alta',
    ordinal: 1,
    title: 'Libreria Acqua Alta',
    neighborhood: 'Castello (Calle Lunga Santa Maria Formosa)',
    distanceMeters: 350,
    lookFor: 'A gondola full of books inside a shop.\nA staircase made of old encyclopedias out back.',
    mapUrl: 'https://www.openstreetmap.org/search?query=Libreria%20Acqua%20Alta%20Venice',
    subtitle: 'The bookstore that sails but never sinks',
    body: 'Sir Mewurisius shakes water off his paws. When the acqua alta floods Venice, the books here float safely in gondolas and bathtubs.\nClimb the book-staircase and peek over the wall — that is your first treasure view.',
    catQuote: 'Mrrrow! Books are boats for the mind. Climb carefully, little gondolier.',
  },
  {
    id: 'bovolo',
    ordinal: 2,
    title: 'Scala Contarini del Bovolo',
    neighborhood: 'San Marco (Corte del Bovolo)',
    distanceMeters: 420,
    lookFor: 'A white snail-shell spiral staircase.\nArches curling up like a stone seashell.',
    mapUrl: 'https://www.openstreetmap.org/search?query=Scala%20Contarini%20del%20Bovolo%20Venice',
    subtitle: 'The snail of stone',
    body: 'Bovolo means snail in Venetian. This staircase curls 26 meters into the sky.\nCount the arches as you climb — the cats of Venice count pigeons instead.',
    catQuote: 'Up, up, up! Even I get dizzy, and I always land on my feet.',
  },
  {
    id: 'mori',
    ordinal: 3,
    title: 'Campo dei Mori',
    neighborhood: 'Cannaregio (Fondamenta dei Mori)',
    distanceMeters: 600,
    lookFor: 'Three stone Moors with rusted noses.\nA camel relief and a house with a Tintin mystery.',
    mapUrl: 'https://www.openstreetmap.org/search?query=Campo%20dei%20Mori%20Venice',
    subtitle: 'The three silent guardians',
    body: 'Three merchants from Morea stand guard here for 600 years. Rubbed noses bring luck, they say.\nFind Sior Antonio Rioba with his rusty iron nose.',
    catQuote: 'Shhh… the stone gentlemen are sleeping. Tiptoe like a cat.',
  },
  {
    id: 'ponte-chiodo',
    ordinal: 4,
    title: 'Ponte Chiodo',
    neighborhood: 'Cannaregio (Rio di San Felice)',
    distanceMeters: 280,
    lookFor: 'A small bridge with NO railing.\nStone steps straight down to the water.',
    mapUrl: 'https://www.openstreetmap.org/search?query=Ponte%20Chiodo%20Venice',
    subtitle: 'The nail bridge with no sides',
    body: 'Chiodo means nail. This is one of the last bridges in Venice without parapets.\nLong ago it could be lifted like a drawbridge. Hold paws and cross bravely!',
    catQuote: 'No railings! Walk the middle, tail high for balance.',
  },
  {
    id: 'san-pietro',
    ordinal: 5,
    title: 'San Pietro di Castello',
    neighborhood: 'Castello (Isola di San Pietro)',
    distanceMeters: 800,
    lookFor: 'A huge white church on a grassy campo.\nA leaning bell tower over the lagoon.',
    mapUrl: 'https://www.openstreetmap.org/search?query=San%20Pietro%20di%20Castello%20Venice',
    subtitle: 'The quiet cathedral island',
    body: 'Before St. Mark’s, this was Venice’s cathedral. Green grass, few crowds, perfect for a picnic.\nYou found the final treasure: quiet Venice itself.',
    catQuote: 'Purrrfect! You are now an official Secret Venice Explorer!',
  },
];

async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // API route: GET /api/hello?name=...
  if (url.pathname === '/api/hello') {
    const name = url.searchParams.get('name') || 'World';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `Hello, ${name}!` }));
    return;
  }

  // Health check
  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // API: treasures list (inspired replica, original content)
  if (url.pathname === '/api/treasures') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(TREASURES));
    return;
  }

  // Static: serve public/index.html for / 
  if (url.pathname === '/' || url.pathname === '/index.html') {
    try {
      const html = await readFile(join(__dirname, 'public', 'index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Missing public/index.html');
    }
    return;
  }

  // Static: serve other public files (app.js, style.css)
  if (url.pathname === '/app.js' || url.pathname === '/style.css') {
    const filePath = resolve(join(__dirname, 'public', url.pathname.slice(1)));
    const publicDir = join(__dirname, 'public');
    if (!filePath.startsWith(publicDir + sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }
    try {
      const file = await readFile(filePath);
      const ext = url.pathname.slice(url.pathname.lastIndexOf('.'));
      res.writeHead(200, { 'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream' });
      res.end(file);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

const server = createServer(handler);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

export { handler };
