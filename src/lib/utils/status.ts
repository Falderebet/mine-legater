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
	return new Date(deadline) < new Date();
}
