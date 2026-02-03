// js/supabaseClient.js
const SUPABASE_URL = "https://aqrcvgjoylzueuldsqxq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcmN2Z2pveWx6dWV1bGRzcXhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTA5OTIsImV4cCI6MjA4NTM2Njk5Mn0.m1LU72zU8DMqZJtUibHJX7UhzC0BxKBq4VN8DuM58n0";

window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
