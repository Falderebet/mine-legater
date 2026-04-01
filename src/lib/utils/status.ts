export const statusLabels: Record<string, string> = {
	draft: 'Kladde',
	in_progress: 'I gang',
	submitted: 'Indsendt',
	accepted: 'Accepteret',
	rejected: 'Afvist'
};

export const statusVariants: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
	draft: 'default',
	in_progress: 'info',
	submitted: 'warning',
	accepted: 'success',
	rejected: 'danger'
};

export const categoryLabels: Record<string, string> = {
	motivated_application: 'Motiveret ansøgning',
	budget: 'Budget',
	cv: 'CV',
	project_description: 'Projektbeskrivelse',
	residence_documentation: 'Dokumentation for ophold',
	other: 'Andet'
};

export function formatDate(dateStr: string | null): string {
	if (!dateStr) return '';
	const d = new Date(dateStr);
	return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function isOverdue(deadline: string | null): boolean {
	if (!deadline) return false;
	// Normalize both dates to YYYY-MM-DD to avoid timezone issues with date-only strings
	const deadlineDate = new Date(deadline);
	if (isNaN(deadlineDate.getTime())) return false;
	const today = new Date();
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
	const deadlineStr = deadline.length === 10 ? deadline : deadlineDate.toISOString().slice(0, 10);
	return deadlineStr < todayStr;
}
