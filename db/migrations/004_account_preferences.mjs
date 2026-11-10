export async function up(db) {
  await db.schema.alterTable('users', table => { table.boolean('order_notifications').notNullable().defaultTo(true) })
}
export async function down(db) {
  await db.schema.alterTable('users', table => { table.dropColumn('order_notifications') })
}
