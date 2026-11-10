import { readConfig } from '../apps/api/src/config.js'
import { createDatabase } from '../apps/api/src/db/client.js'
import { expirePending } from '../apps/api/src/modules/orders/service.js'
const db = createDatabase(readConfig().DATABASE_URL)
try { await expirePending(db) } finally { await db.destroy() }
