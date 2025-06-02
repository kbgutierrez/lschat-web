'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ContactListItem } from '@/lib/api';

interface ContactSearchResult {
  user_id: number;
  first_name: string;
  last_name: string;
  mobile_number: string;
  status?: string;
}

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contactId: number) => Promise<boolean | void>;
  existingContacts?: ContactListItem[];
  currentUserId?: string | number;
  onContactAdded?: () => void;  
}

export default function AddContactModal({ 
  isOpen, 
  onClose, 
  onAddContact, 
  existingContacts = [],
  currentUserId,
  onContactAdded
}: AddContactModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ContactSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactSearchResult | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setIsLoading(false);
      setError(null);
      setSelectedContact(null);
      setAddSuccess(false);
      setShowConfirmation(false);
    
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    if (searchTerm.trim().length < 2) {
      return;
    }

    setIsLoading(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setError(null);
        const results = await fetchAPI<ContactSearchResult[]>(
          `/api/search-contacts?search_data=${encodeURIComponent(searchTerm)}`, 
          {}, 
          true
        );
        
        const filteredResults = results.filter(result => {
          if (currentUserId !== undefined && 
              String(result.user_id) === String(currentUserId)) {
            return false;
          }
          
          const existingContact = existingContacts.find(contact => 
            contact.contact_id === result.user_id
          );
          
          if (!existingContact) {
            return true;
          } else if (existingContact.status?.toLowerCase() === 'pending') {
            // Make the check case-insensitive
            result.status = 'pending';
            console.log(`Contact ${result.first_name} ${result.last_name} is pending`);
            return true;
          }
          
          return false;
        });
        
        setSearchResults(filteredResults);
        
        if (filteredResults.length === 0) {
          if (results.length > 0) {
            if (results.length === 1 && String(results[0].user_id) === String(currentUserId)) {
              setError("You cannot add yourself as a contact.");
            } else {
              setError("These contacts are already in your contacts list.");
            }
          } else {
            setError("No contacts found. Try a different search term.");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search contacts');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, existingContacts, currentUserId]);
  
  const handleContactSelect = (contact: ContactSearchResult) => {
    setSelectedContact(contact);
    setShowConfirmation(false);
  };
  
  const initiateAddContact = () => {
    if (!selectedContact) return;
    
    if (selectedContact.status === 'pending') {
      setAddSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
      return;
    }
    
    setShowConfirmation(true);
  };
  
  const handleAddContact = async () => {
    if (!selectedContact) return;
    
    setIsAdding(true);
    setError(null);
    
    try {
      await onAddContact(selectedContact.user_id);
      setAddSuccess(true);
      
      // Call onContactAdded to refresh contact lists in parent components
      if (onContactAdded) {
        onContactAdded();
      }
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact');
      setShowConfirmation(false);
      setIsAdding(false);
    }
  };

  const cancelAddContact = () => {
    setShowConfirmation(false);
  };

  const isPending = selectedContact?.status === 'pending';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-150"
      >
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {showConfirmation ? 'Confirmation' : 'Add New Contact'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 cursor-pointer hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="p-5">
          {showConfirmation ? (
            <div className="text-center py-4">
              <div className="mx-auto w-16 h-16 flex items-center justify-center bg-violet-100 dark:bg-violet-900/30 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Add {selectedContact?.first_name} {selectedContact?.last_name}?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                A connection request will be sent. You can start messaging once they approve.
              </p>
              {error && (
                <div className="mb-4 p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="flex space-x-3 justify-center">
                <button 
                  onClick={cancelAddContact}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddContact}
                  className={cn(
                    "px-4 py-2 bg-violet-600 text-white rounded-lg flex items-center justify-center min-w-[100px]",
                    isAdding ? "opacity-80" : "hover:bg-violet-700"
                  )}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or mobile number..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                {isLoading && (
                  <div className="absolute right-2 top-2 p-1">
                    <svg className="animate-spin h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              {addSuccess && (
                <div className="mb-4 p-3 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm">
                  {isPending 
                    ? "Contact request already sent. Waiting for approval." 
                    : "Contact request sent successfully!"}
                </div>
              )}
              
              {error && !addSuccess && (
                <div className="mb-4 p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {searchTerm.length > 0 && searchResults.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Results
                  </h4>
                  <div className="max-h-60 overflow-y-auto">
                    {searchResults.map(contact => {
                      const isPending = contact.status?.toLowerCase() === 'pending';
                      console.log(`Contact ${contact.first_name} ${contact.last_name} status: ${contact.status}, isPending: ${isPending}`);
                      
                      return (
                        <div 
                          key={contact.user_id}
                          onClick={() => !isPending && handleContactSelect(contact)}
                          className={cn(
                            "p-3 mb-2 border rounded-lg transition-colors",
                            selectedContact?.user_id === contact.user_id && !isPending
                              ? "bg-violet-50 border-violet-300 dark:bg-violet-900/30 dark:border-violet-800" 
                              : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700",
                            isPending && "opacity-70 cursor-not-allowed hover:bg-white dark:hover:bg-gray-800"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                                {contact.first_name} {contact.last_name}
                                {isPending && (
                                  <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                                    Pending
                                  </span>
                                )}
                              </h5>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {contact.mobile_number}
                              </p>
                            </div>
                            {selectedContact?.user_id === contact.user_id && !isPending && (
                              <div className="text-violet-600 dark:text-violet-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {!showConfirmation && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={initiateAddContact}
              disabled={!selectedContact || isAdding}
              className={cn(
                "px-4 py-2 text-white rounded-lg flex items-center",
                !selectedContact || isAdding
                  ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                  : isPending 
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-violet-600 hover:bg-violet-700"
              )}
            >
              {isPending ? 'View Pending Request' : 'Add Contact'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
