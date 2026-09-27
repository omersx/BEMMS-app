const { Client } = require('pg');

async function resetTicket() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://bemms:bemms_dev_password@localhost:5432/bemms_db',
  });
  await client.connect();

  const ticketId = '3f06d577-7003-46ef-8856-678a0ddb7b00';

  // Reset the ticket back to 'new' so user can test triage again
  const res = await client.query(
    `UPDATE service_tickets SET status_code = 'new', triaged_at = NULL, triaged_by_user_id = NULL, updated_at = NOW() WHERE id = $1 RETURNING id, status_code`,
    [ticketId]
  );

  if (res.rows.length > 0) {
    console.log('Ticket reset to "new":', res.rows[0]);
  } else {
    console.log('Ticket not found');
  }

  await client.end();
}

resetTicket().catch(console.error);
