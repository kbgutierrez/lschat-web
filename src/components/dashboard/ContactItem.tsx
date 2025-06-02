'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ContactListItem } from '@/lib/api';
import { gsap } from 'gsap';

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}


interface ContactItemProps {
  contact: ContactListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  email?: string;
  lastMessage?: string;
}

export function ContactItem({ contact, isSelected, onSelect, lastMessage }: ContactItemProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (!buttonRef.current) return;
    
    const button = buttonRef.current;
    
    const enterHandler = () => {
      if (isSelected) return;
      
      gsap.to(button, {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        scale: 1.01,
        duration: 0.2
      });
    };
    
    const leaveHandler = () => {
      if (isSelected) return;
      
      gsap.to(button, {
        backgroundColor: 'transparent',
        scale: 1,
        duration: 0.2
      });
    };
    
    button.addEventListener('mouseenter', enterHandler);
    button.addEventListener('mouseleave', leaveHandler);
    
    return () => {
      button.removeEventListener('mouseenter', enterHandler);
      button.removeEventListener('mouseleave', leaveHandler);
    };
  }, [isSelected]);
  
  useEffect(() => {
    if (!buttonRef.current) return;
    
    if (isSelected) {
      gsap.fromTo(buttonRef.current,
        { 
          backgroundColor: 'rgba(255, 255, 255, 0.08)'
        }, 
        {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          duration: 0.3,
          ease: "power1.inOut"
        }
      );
    } else {
      gsap.to(buttonRef.current, {
        backgroundColor: 'transparent',
        duration: 0.3,
        ease: "power1.out"
      });
    }
  }, [isSelected]);

  const isPending = contact.status === 'pending';

  return (
    <button
      ref={buttonRef}
      className={cn(
        "w-full flex items-center p-3 rounded-lg transition-colors duration-200 mb-1 cursor-pointer",
        isSelected
          ? "bg-white/20 dark:bg-violet-900/30" 
          : "hover:bg-white/10 dark:hover:bg-gray-800/50",
        isPending && "opacity-75 cursor-not-allowed" 
      )}
      onClick={() => !isPending && onSelect(contact.contact_id.toString())} 
      title={isPending ? "Request pending approval" : undefined}
      disabled={isPending} 
    >
      <div className="relative flex-shrink-0">
        {contact.contact_picture ? (
          <img 
          src={contact.contact_picture} 
          alt=""
          className='w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700'
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 text-base font-bold">
            {getInitials(contact.contact_full_name)}
          </div>
        )}
        <div className={cn(
          "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-violet-900 dark:border-gray-900",
          contact.status === 'online' ? 'bg-green-500' : 
          contact.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
        )}></div>
      </div>
      
      <div className="ml-3 flex-1 text-left overflow-hidden">
        <div className="flex items-center">
          <p className="text-white dark:text-white font-medium truncate">{contact.contact_full_name}</p>
          {isPending && (
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400 truncate">
              Pending
            </span>
          )}
        </div>
        <p className="text-sm text-white/70 dark:text-gray-400 truncate">
          {isPending ? "Waiting for approval" : lastMessage || ""}
        </p>
      </div>
    </button>
  );
}
