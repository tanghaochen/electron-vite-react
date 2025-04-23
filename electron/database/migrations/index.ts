/**
 * Ǩ�ƽű����Ͷ���
 * ÿ��Ǩ�ƽű�������
 * - version: �汾��
 * - up: ����������ִ�����ݿ�ṹ���
 * - down: �������������ڻع��������ѡ��
 */
interface Migration {
  version: number;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

/**
 * ���ݿ�Ǩ�ƽű��б�
 * ÿ���汾��Ӧһ��Ǩ�ƽű������汾��˳��ִ��
 * Q: �������һ��Ǩ�ƽű���
 * 1. ��Ҫ�½�һ��version���ݣ� �������������������޸�
 */
export const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      // ��ʼ�汾�ı�ṹ
      // �������л�����
      db.exec(`
        // �汾���Ʊ���¼��ǰ���ݿ�汾
        CREATE TABLE schema_version (
          version INTEGER PRIMARY KEY
        );

        // ��������ڹ���ʼǷ���
        CREATE TABLE categories (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid       TEXT NOT NULL UNIQUE DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
          name       TEXT NOT NULL UNIQUE,
          icon       TEXT NOT NULL DEFAULT 'folder',
          sort_order INTEGER DEFAULT 0,
          color      TEXT DEFAULT '#3498db',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        // �û�ƫ�����ñ�
        CREATE TABLE user_preferences (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id    TEXT NOT NULL DEFAULT '',
          settings_json TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        // ��ǩ�����ڹ���ʼǱ�ǩ
        CREATE TABLE tags (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid        TEXT NOT NULL UNIQUE DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          parent_id   INTEGER DEFAULT 0,
          name        TEXT NOT NULL DEFAULT '',
          label       TEXT NOT NULL DEFAULT '',
          icon        TEXT NOT NULL DEFAULT 'tag',
          color       TEXT DEFAULT '#3498db',
          lft         INTEGER DEFAULT 0,
          rgt         INTEGER DEFAULT 0,
          sort_order  INTEGER DEFAULT 0,
          created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        // ��ǩ�㼶��ϵ������ʵ�ֱ�ǩ�����νṹ
        CREATE TABLE tag_closure (
          ancestor    INTEGER NOT NULL,
          descendant  INTEGER NOT NULL,
          depth       INTEGER NOT NULL DEFAULT 0,
          category_id INTEGER NOT NULL,
          PRIMARY KEY (ancestor, descendant),
          FOREIGN KEY (ancestor) REFERENCES tags(id) ON DELETE CASCADE,
          FOREIGN KEY (descendant) REFERENCES tags(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        );

        // �ʼ�Ԫ���ݱ��洢�ʼǵĻ�����Ϣ
        CREATE TABLE notes_metadata (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          tags_id    INTEGER NOT NULL DEFAULT 0,
          title      TEXT NOT NULL DEFAULT '',
          sort_order INTEGER DEFAULT 0,
          icon       TEXT NOT NULL DEFAULT '',
          img        TEXT NOT NULL DEFAULT '',
          desc       TEXT NOT NULL DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_pinned  BOOLEAN DEFAULT 0
        );

        // �ʼ����ݱ��洢�ʼǵľ�������
        CREATE TABLE notes_content (
          note_id    INTEGER PRIMARY KEY,
          content    TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (note_id) REFERENCES notes_metadata(id)
        );

        // �ʼ�-��ǩ������ʵ�ֱʼǺͱ�ǩ�Ķ�Զ��ϵ
        CREATE TABLE note_tags (
          note_id INTEGER NOT NULL,
          tag_id  INTEGER NOT NULL,
          PRIMARY KEY (note_id, tag_id),
          FOREIGN KEY (note_id) REFERENCES notes_metadata(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );

        // ȫ������������ʵ�ֱʼǵ�ȫ����������
        CREATE VIRTUAL TABLE notes_fts USING fts5(
          title,
          content,
          content_rowid='note_id'
        );

        // ��ʼ���汾��
        INSERT INTO schema_version (version) VALUES (1);
      `);
    },
  },
  {
    version: 2,
    up: (db) => {
      // ʾ����������ֶ�
      db.exec(`
        -- ��һ������Ӳ���Ĭ��ֵ����
        ALTER TABLE notes_metadata ADD COLUMN is_archived BOOLEAN;
        ALTER TABLE notes_metadata ADD COLUMN last_viewed_at DATETIME;
        
        -- �ڶ����������������м�¼
        UPDATE notes_metadata SET is_archived = 0 WHERE is_archived IS NULL;
        UPDATE notes_metadata SET last_viewed_at = datetime('now') WHERE last_viewed_at IS NULL;
      `);
    },
    down: (db) => {
      // �ع�����
      db.exec(`
        CREATE TABLE notes_metadata_backup AS SELECT id, tags_id, title, sort_order, icon, img, desc, created_at, updated_at, is_pinned FROM notes_metadata;
        DROP TABLE notes_metadata;
        ALTER TABLE notes_metadata_backup RENAME TO notes_metadata;
      `);
    },
  },
  {
    version: 3,
    up: (db) => {
      // ���notes_content���updated_at�ֶ�
      db.exec(`
        -- ��һ������Ӳ���Ĭ��ֵ����
        ALTER TABLE notes_content ADD COLUMN updated_at DATETIME;
        
        -- �ڶ����������������м�¼��updated_atΪ��ǰʱ��
        UPDATE notes_content SET updated_at = datetime('now') WHERE updated_at IS NULL;
      `);
    },
    down: (db) => {
      // �ع�������������ʱ���������ݣ�ɾ��ԭ����������ʱ��
      db.exec(`
        CREATE TABLE notes_content_backup AS 
          SELECT note_id, content 
          FROM notes_content;
        DROP TABLE notes_content;
        CREATE TABLE notes_content (
          note_id INTEGER PRIMARY KEY,
          content TEXT NOT NULL,
          FOREIGN KEY (note_id) REFERENCES notes_metadata(id)
        );
        INSERT INTO notes_content (note_id, content)
          SELECT note_id, content FROM notes_content_backup;
        DROP TABLE notes_content_backup;
      `);
    },
  },
];
