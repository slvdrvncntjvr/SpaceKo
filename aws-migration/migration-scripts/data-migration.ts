// Data Migration Script: PostgreSQL to DynamoDB
import { Pool } from 'pg';
import { dynamoStorage } from '../dynamodb-schema';
import { z } from 'zod';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Migration logging
const log = (message: string) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// Migration functions
export class DataMigration {
  
  async migrateResources() {
    log('Starting resource migration...');
    
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM resources');
      
      let migrated = 0;
      let failed = 0;
      
      for (const row of result.rows) {
        try {
          await dynamoStorage.createResource({
            id: row.id.toString(),
            name: row.name,
            type: row.type,
            category: row.category,
            wing: row.wing,
            floor: row.floor,
            room: row.room,
            status: row.status,
            lastUpdated: row.last_updated.toISOString(),
            updatedBy: row.updated_by,
            verifiedBy: row.verified_by,
            verifiedAt: row.verified_at?.toISOString(),
            ownedBy: row.owned_by,
            stallNumber: row.stall_number,
          });
          
          migrated++;
          if (migrated % 100 === 0) {
            log(`Migrated ${migrated} resources...`);
          }
        } catch (error) {
          failed++;
          log(`Failed to migrate resource ${row.id}: ${error}`);
        }
      }
      
      client.release();
      log(`Resource migration completed: ${migrated} migrated, ${failed} failed`);
      
    } catch (error) {
      log(`Resource migration failed: ${error}`);
      throw error;
    }
  }
  
  async migrateUsers() {
    log('Starting user migration...');
    
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM users');
      
      let migrated = 0;
      let failed = 0;
      
      for (const row of result.rows) {
        try {
          await dynamoStorage.createUser({
            userCode: row.user_code,
            username: row.username,
            userType: row.user_type,
            isActive: row.is_active,
            createdBy: row.created_by,
            studentId: row.student_id,
            grade: row.grade,
            section: row.section,
            office: row.office,
            position: row.position,
            workplace: row.workplace,
            employeeId: row.employee_id,
          });
          
          migrated++;
          if (migrated % 50 === 0) {
            log(`Migrated ${migrated} users...`);
          }
        } catch (error) {
          failed++;
          log(`Failed to migrate user ${row.user_code}: ${error}`);
        }
      }
      
      client.release();
      log(`User migration completed: ${migrated} migrated, ${failed} failed`);
      
    } catch (error) {
      log(`User migration failed: ${error}`);
      throw error;
    }
  }
  
  async migrateContributors() {
    log('Starting contributor migration...');
    
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM contributors');
      
      let migrated = 0;
      let failed = 0;
      
      for (const row of result.rows) {
        try {
          // Update contributor (will create if doesn't exist)
          await dynamoStorage.updateContributor(
            row.user_code,
            row.username,
            row.user_type
          );
          
          migrated++;
        } catch (error) {
          failed++;
          log(`Failed to migrate contributor ${row.user_code}: ${error}`);
        }
      }
      
      client.release();
      log(`Contributor migration completed: ${migrated} migrated, ${failed} failed`);
      
    } catch (error) {
      log(`Contributor migration failed: ${error}`);
      throw error;
    }
  }
  
  async validateMigration() {
    log('Starting migration validation...');
    
    try {
      const client = await pool.connect();
      
      // Count records in PostgreSQL
      const resourceCount = await client.query('SELECT COUNT(*) FROM resources');
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      const contributorCount = await client.query('SELECT COUNT(*) FROM contributors');
      
      log(`PostgreSQL counts: Resources: ${resourceCount.rows[0].count}, Users: ${userCount.rows[0].count}, Contributors: ${contributorCount.rows[0].count}`);
      
      // Sample validation - check some records exist in DynamoDB
      const sampleResource = await client.query('SELECT * FROM resources LIMIT 1');
      if (sampleResource.rows.length > 0) {
        const dynamoResource = await dynamoStorage.getResource(sampleResource.rows[0].id.toString());
        if (dynamoResource) {
          log('✓ Sample resource validation passed');
        } else {
          log('✗ Sample resource validation failed');
        }
      }
      
      const sampleUser = await client.query('SELECT * FROM users LIMIT 1');
      if (sampleUser.rows.length > 0) {
        const dynamoUser = await dynamoStorage.getUser(sampleUser.rows[0].user_code);
        if (dynamoUser) {
          log('✓ Sample user validation passed');
        } else {
          log('✗ Sample user validation failed');
        }
      }
      
      client.release();
      log('Migration validation completed');
      
    } catch (error) {
      log(`Migration validation failed: ${error}`);
      throw error;
    }
  }
  
  async runFullMigration() {
    log('Starting full migration process...');
    
    try {
      await this.migrateUsers();
      await this.migrateResources();
      await this.migrateContributors();
      await this.validateMigration();
      
      log('Full migration completed successfully!');
      
    } catch (error) {
      log(`Full migration failed: ${error}`);
      throw error;
    }
  }
}

// CLI runner
if (require.main === module) {
  const migration = new DataMigration();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'resources':
      migration.migrateResources();
      break;
    case 'users':
      migration.migrateUsers();
      break;
    case 'contributors':
      migration.migrateContributors();
      break;
    case 'validate':
      migration.validateMigration();
      break;
    case 'full':
      migration.runFullMigration();
      break;
    default:
      console.log('Usage: node data-migration.js [resources|users|contributors|validate|full]');
      process.exit(1);
  }
}