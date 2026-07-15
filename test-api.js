import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api', withCredentials: true });

async function run() {
  try {
    console.log('Registering user...');
    await api
      .post('/auth/register', { name: 'Test', email: 'test2@test.com', password: 'password' })
      .catch((e) => {
        if (e.response?.status !== 409) throw e;
      });

    console.log('Logging in...');
    const loginRes = await api.post('/auth/login', {
      email: 'test2@test.com',
      password: 'password',
    });
    const cookie = loginRes.headers['set-cookie'] || loginRes.headers['set-cookie']?.[0];

    // Extract the JWT token specifically since axios might not handle set-cookie array correctly in Node
    const config = { headers: { Cookie: Array.isArray(cookie) ? cookie[0] : cookie } };

    console.log('Fetching me...');
    const meRes = await api.get('/auth/me', config);
    console.log('Me:', meRes.data);

    console.log('Creating room...');
    const createRes = await api.post('/rooms', { name: 'My Test Room', language: 'cpp' }, config);
    const roomId = createRes.data.id;
    console.log('Created room:', roomId);

    console.log('Fetching rooms...');
    const listRes = await api.get('/rooms', config);
    console.log('Rooms length:', listRes.data.length);

    console.log('Updating room...');
    const updateRes = await api.patch(`/rooms/${roomId}`, { name: 'Updated Room' }, config);
    console.log('Updated room response:', updateRes.data);

    console.log('Deleting room...');
    const deleteRes = await api.delete(`/rooms/${roomId}`, config);
    console.log('Delete room response:', deleteRes.data);

    console.log('SUCCESS');
  } catch (error) {
    console.error('ERROR:', error.response?.data || error.message);
  }
}
run();
