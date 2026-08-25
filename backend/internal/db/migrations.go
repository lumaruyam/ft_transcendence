// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: running GORM auto-migrations / SQL migrations so the schema in db-schema.md matches the live database.
package db

import "gorm.io/gorm"

// RunMigrations applies all pending schema migrations for the models defined in models.go.
func RunMigrations(conn *gorm.DB) error {
	// TODO: call conn.AutoMigrate(...) for every model (User, Project, ProjectMember, Board, List, Card, Note, Attachment, GitLink, Notification, WebhookEvent, APIKey)
	// TODO: keep in sync with infra/migrations/*.sql for environments that use plain SQL migrations instead of GORM auto-migrate
	// TODO: return a wrapped error if any migration step fails, so main.go can fail fast on boot
	return nil
}
