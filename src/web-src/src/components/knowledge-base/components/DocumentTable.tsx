import React from 'react';
import { format } from 'date-fns';
import { Eye, Trash2 } from 'lucide-react';
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
import StatusIndicator, { StatusType } from '@/components/chat/components/StatusIndicator.tsx';
import { KnowledgeBaseDocModel } from '@/models/ApiModels';
import { formatBytes } from '../utils/formatters';

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
    return (
        <div className="w-full overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead className="w-20">Status</TableHead>
                        <TableHead>Document Name</TableHead>
                        <TableHead className="w-28 whitespace-nowrap">Upload Date</TableHead>
                        <TableHead className="w-28 whitespace-nowrap">Last Updated</TableHead>
                        <TableHead className="w-16 whitespace-nowrap">Size</TableHead>
                        <TableHead className="w-20 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.map((doc, index) => (
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