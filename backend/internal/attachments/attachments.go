// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: the File upload minor module — attachments on cards/notes, and the destination for exported whiteboard images.
package attachments

import (
	"context"

	"ft-transcendence/internal/db"
)

// UploadAttachmentRequest is the validated shape of a file upload, including whiteboard PNG exports.
type UploadAttachmentRequest struct {
	ProjectID uint
	CardID    *uint
	FileName  string
	FileType  string
	FileBytes []byte
}

// UploadAttachment stores an uploaded file and records it in the attachments table.
func UploadAttachment(ctx context.Context, uploadedBy uint, req UploadAttachmentRequest) (*db.Attachment, error) {
	// TODO: call ValidateFileUpload first (type/size checks)
	// TODO: write the file to storage and get back a file_url
	// TODO: insert the attachments row (covers both regular uploads and whiteboard exports per the plan)
	// TODO: fire a notification via Track 4's notifications package ("file uploaded")
	return nil, nil
}

// GetAttachment fetches an attachment's metadata for download/preview.
func GetAttachment(ctx context.Context, id uint) (*db.Attachment, error) {
	// TODO: query attachments by primary key
	return nil, nil
}

// DeleteAttachment removes an uploaded file and its record.
func DeleteAttachment(ctx context.Context, id uint) error {
	// TODO: remove the underlying stored file, then delete the attachments row
	return nil
}

// ValidateFileUpload checks file type/size against allowed limits before storage.
func ValidateFileUpload(req UploadAttachmentRequest) error {
	// TODO: allow-list file types (images, documents, whiteboard PNG exports), enforce a max size
	return nil
}
