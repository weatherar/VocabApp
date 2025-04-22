import React from "react";
import { useState, useEffect } from "react";
import {
	collection,
	query,
	getDocs,
	addDoc,
	deleteDoc,
	doc,
} from "firebase/firestore";
import { db } from "../config/firebase";

interface VocabWord {
	id: string;
	word: string;
	meaning: string;
	example: string;
}

