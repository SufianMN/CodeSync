async function run() {
  const BASE_URL = 'http://localhost:3000/api';
  let cookie = '';

  async function fetchApi(path, method, body = null) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { 'Cookie': cookie } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      cookie = setCookie;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`[${res.status}] ${JSON.stringify(err)}`);
    }

    return res.json();
  }

  try {
    console.log('Registering user...');
    await fetchApi('/auth/register', 'POST', { name: 'Test User', email: 'test3@test.com', password: 'password' }).catch(e => {
      if (!e.message.includes('[409]')) throw e;
    });

    console.log('Logging in...');
    await fetchApi('/auth/login', 'POST', { email: 'test3@test.com', password: 'password' });

    console.log('Fetching me...');
    const me = await fetchApi('/auth/me', 'GET');
    console.log('Me:', me);

    console.log('Creating room...');
    const createdRoom = await fetchApi('/rooms', 'POST', { name: 'Fetch Test Room', language: 'python' });
    const roomId = createdRoom.id;
    console.log('Created room:', roomId);

    console.log('Fetching rooms...');
    const rooms = await fetchApi('/rooms', 'GET');
    console.log('Rooms length:', rooms.length);
    console.log('First room:', rooms[0]);

    console.log('Updating room...');
    const updatedRoom = await fetchApi(`/rooms/${roomId}`, 'PATCH', { name: 'Updated Fetch Room' });
    console.log('Updated room:', updatedRoom);

    console.log('Deleting room...');
    await fetchApi(`/rooms/${roomId}`, 'DELETE');
    console.log('Deleted successfully');

    console.log('Fetching rooms final...');
    const finalRooms = await fetchApi('/rooms', 'GET');
    console.log('Final rooms length:', finalRooms.length);

    console.log('ALL API TESTS PASSED!');
  } catch (err) {
    console.error('API TEST FAILED:', err.message);
  }
}

run();
