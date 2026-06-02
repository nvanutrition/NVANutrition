'use client';

import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Image src="/logo.png" alt="NVA Nutrition" width={200} height={80} className="w-auto h-16 mb-4 object-contain" />
            <p className="text-gray-300">Fuel Your Performance. Transform Your Body.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/" className="hover:text-green-600 transition">Home</Link></li>
              <li><Link href="/products" className="hover:text-green-600 transition">Products</Link></li>
              <li><Link href="/about" className="hover:text-green-600 transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-green-600 transition">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500" />
                +91 9508716607
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-500" />
                info@nvanutrition.in
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-500" />
                Noida, India
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold mb-4">Follow Us</h3>
            <div className="flex gap-2">
              <a href="#" aria-label="Instagram" className="p-2 text-gray-400 hover:text-green-500 transition">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Facebook" className="p-2 text-gray-400 hover:text-green-500 transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Twitter" className="p-2 text-gray-400 hover:text-green-500 transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" aria-label="LinkedIn" className="p-2 text-gray-400 hover:text-green-500 transition">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; 2026 NVA Nutrition. All rights reserved.</p>
          <p className="mt-2 text-sm">Premium Sports Nutrition for Champions</p>
        </div>
      </div>
    </footer>
  );
}
