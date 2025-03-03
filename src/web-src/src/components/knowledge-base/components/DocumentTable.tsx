import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Eye, Trash2, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { Button } from '@/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/ui/table";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/ui/hover-card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/ui/alert-dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/ui/popover";
import { Checkbox } from "@/ui/checkbox";
import StatusIndicator, { StatusType } from '@/components/chat/components/StatusIndicator.tsx';
import { KnowledgeBaseDocModel, KnowledgeBaseDocStatus } from '@/models/ApiModels';
import { formatBytes } from '../utils/formatters';

// Define sort types
type SortField = 'file_name' | 'created_at' | 'updated_at' | 'content_length' | null;
type SortDirection = 'asc' | 'desc';

interface DocumentTableProps {
    documents: KnowledgeBaseDocModel[];
    currentPage: number;
    itemsPerPage: number;
    onView: (doc: KnowledgeBaseDocModel) => void;
    onDelete: (id: string) => void;
    isIndexing?: boolean; // Optional prop for indexing state
}

const DocumentTable: React.FC<DocumentTableProps> = ({
    documents,
    currentPage,
    itemsPerPage,
    onView,
    onDelete,
    isIndexing = false
}) => {
    // State for sorting
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    
    // State for status filtering
    const [statusFilters, setStatusFilters] = useState<KnowledgeBaseDocStatus[]>([]);
    const [statusFilterOpen, setStatusFilterOpen] = useState(false);
    
    // All possible statuses from the KnowledgeBaseDocStatus type
    const allStatuses: KnowledgeBaseDocStatus[] = [
        "Unknown",
        "Not Indexed",
        "In Progress", 
        "Indexed",
        "Index Failed"
    ];
    
    // Handle sorting
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Toggle direction if clicking the same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new sort field and default to ascending
            setSortField(field);
            setSortDirection('asc');
        }
    };
    
    // Handle status filter toggling
    const toggleStatusFilter = (status: KnowledgeBaseDocStatus) => {
        setStatusFilters(prev => {
            if (prev.includes(status)) {
                return prev.filter(s => s !== status);
            } else {
                return [...prev, status];
            }
        });
    };
    
    // Filter and sort documents
    const processedDocuments = useMemo(() => {
        // First apply filters
        let filtered = [...documents];
        
        if (statusFilters.length > 0) {
            filtered = filtered.filter(doc => statusFilters.includes(doc.status));
        }
        
        // Then sort
        if (sortField) {
            filtered.sort((a, b) => {
                let valueA, valueB;
                
                // Extract the values to compare based on the sort field
                switch (sortField) {
                    case 'file_name':
                        valueA = a.file_name.toLowerCase();
                        valueB = b.file_name.toLowerCase();
                        break;
                    case 'created_at':
                        valueA = new Date(a.created_at).getTime();
                        valueB = new Date(b.created_at).getTime();
                        break;
                    case 'updated_at':
                        valueA = new Date(a.updated_at).getTime();
                        valueB = new Date(b.updated_at).getTime();
                        break;
                    case 'content_length':
                        valueA = a.content_length;
                        valueB = b.content_length;
                        break;
                    default:
                        return 0;
                }
                
                // Compare and apply sort direction
                if (valueA < valueB) {
                    return sortDirection === 'asc' ? -1 : 1;
                }
                if (valueA > valueB) {
                    return sortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return filtered;
    }, [documents, sortField, sortDirection, statusFilters]);
    
    // Render sort icon based on current sort state
    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return null;
        }
        return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />;
    };
    
    return (
        <div className="w-full overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10 text-center">#</TableHead>
                        
                        {/* Status column with filter */}
                        <TableHead className="w-20">
                            <div className="flex items-center space-x-1">
                                <span>Status</span>
                                <Popover open={statusFilterOpen} onOpenChange={setStatusFilterOpen}>
                                    <PopoverTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className={`h-5 w-5 p-0 ${statusFilters.length > 0 ? 'text-primary' : 'text-muted-foreground'}`}
                                        >
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-2" align="start">
                                        <div className="space-y-1">
                                            <h4 className="font-medium text-sm mb-2">Filter by Status</h4>
                                            {allStatuses.map((status) => (
                                                <div key={status} className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={`status-${status}`} 
                                                        checked={statusFilters.includes(status)}
                                                        onCheckedChange={() => toggleStatusFilter(status)}
                                                    />
                                                    <label 
                                                        htmlFor={`status-${status}`} 
                                                        className="text-sm cursor-pointer flex items-center"
                                                    >
                                                        <StatusIndicator 
                                                            status={status as StatusType} 
                                                            className="scale-75"
                                                            showLabel={false}
                                                        />
                                                        <span className="ml-2">{status}</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </TableHead>
                        
                        {/* Document Name column with sorting */}
                        <TableHead 
                            className="cursor-pointer hover:text-foreground"
                            onClick={() => handleSort('file_name')}
                        >
                            <div className="flex items-center">
                                Document Name
                                {renderSortIcon('file_name')}
                            </div>
                        </TableHead>
                        
                        {/* Upload Date column with sorting */}
                        <TableHead 
                            className="w-28 whitespace-nowrap cursor-pointer hover:text-foreground"
                            onClick={() => handleSort('created_at')}
                        >
                            <div className="flex items-center">
                                Upload Date
                                {renderSortIcon('created_at')}
                            </div>
                        </TableHead>
                        
                        {/* Last Updated column with sorting */}
                        <TableHead 
                            className="w-28 whitespace-nowrap cursor-pointer hover:text-foreground"
                            onClick={() => handleSort('updated_at')}
                        >
                            <div className="flex items-center">
                                Last Updated
                                {renderSortIcon('updated_at')}
                            </div>
                        </TableHead>
                        
                        {/* Size column with sorting */}
                        <TableHead 
                            className="w-16 whitespace-nowrap cursor-pointer hover:text-foreground"
                            onClick={() => handleSort('content_length')}
                        >
                            <div className="flex items-center">
                                Size
                                {renderSortIcon('content_length')}
                            </div>
                        </TableHead>
                        
                        <TableHead className="w-20 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {processedDocuments.map((doc, index) => (
                        <TableRow key={doc.id}>
                            <TableCell className="text-center font-mono text-sm text-muted-foreground">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                <StatusIndicator
                                    status={doc.status as StatusType}
                                    tooltip={doc.error}
                                />
                            </TableCell>
                            <TableCell>
                                <HoverCard>
                                    <HoverCardTrigger className="font-medium hover:text-primary transition-colors cursor-pointer block">
                                        <div className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[410px]">
                                            {doc.file_name}
                                        </div>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-80 text-sm">
                                        <h4 className="font-semibold mb-1">{doc.file_name}</h4>
                                        {doc.content_summary && (
                                            <p className="text-muted-foreground text-xs mt-1">
                                                {doc.content_summary || 'No summary available'}
                                            </p>
                                        )}
                                    </HoverCardContent>
                                </HoverCard>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{format(new Date(doc.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{format(new Date(doc.updated_at), 'MMM d, yyyy HH:mm')}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{formatBytes(doc.content_length)}</TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onView(doc)}
                                        disabled={isIndexing}
                                    >
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View</span>
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={isIndexing}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete "{doc.file_name}"? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => onDelete(doc.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default DocumentTable;