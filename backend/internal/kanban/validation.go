// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: backend input validation for all board/list/card forms, per the mandatory dual frontend+backend validation requirement.
package kanban

// ValidateBoardInput checks a board creation/edit request for required fields and length limits.
func ValidateBoardInput(req CreateBoardRequest) error {
	// TODO: title required, non-empty after trim, reasonable max length
	return nil
}

// ValidateListInput checks a list creation/edit request.
func ValidateListInput(req CreateListRequest) error {
	// TODO: title required; board_id must reference an existing board the caller can access
	return nil
}

// ValidateCardInput checks a card creation/edit request.
func ValidateCardInput(req CreateCardRequest) error {
	// TODO: title required; list_id must reference an existing list belonging to the caller's project
	// TODO: assignee, if set, must be a member of the project
	return nil
}
