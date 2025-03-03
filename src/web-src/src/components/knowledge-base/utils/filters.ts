
import { KnowledgeBaseDocModel } from '@/models/ApiModels';

/**
 * Filters document list by search query
 * @param docs Documents to filter
 * @param searchQuery Query string
 * @returns Filtered documents
 */
export function filterDocuments(
  docs: Record<string, KnowledgeBaseDocModel>,
  searchQuery: string
): KnowledgeBaseDocModel[] {
  const filteredDocs = Object.values(docs).filter(doc => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      doc.file_name.toLowerCase().includes(query) ||
      (doc.content_summary && doc.content_summary.toLowerCase().includes(query)) ||
      (doc.status && doc.status.toLowerCase().includes(query))
    );
  });
  
  // Sort by created date (newest first)
  return filteredDocs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
