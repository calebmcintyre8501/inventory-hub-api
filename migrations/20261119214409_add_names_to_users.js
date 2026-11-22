/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable("users", (table) => {
        table.string("first_name");
        table.string("last_name");
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable("users", (table) => {
        table.dropColumn("first_name");
        table.dropColumn("last_name");
    });
};