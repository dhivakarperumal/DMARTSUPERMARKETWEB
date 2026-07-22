fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'test3',
        email: 'test3@example.com',
        password: 'password123'
    })
}).then(async r => console.log(r.status, await r.text())).catch(console.error);
