"use client";

import React, { useState, useEffect, useMemo } from "react";
import styles from "./CarDo.module.css";

export interface Expense {
  id: number;
  name: string;
  price: number;
  completed: boolean;
  createdAt: string;
}

const STORAGE_KEY = "carExpenses";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function CarDoModule() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form input state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  // Edit modal state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // Load from local storage
  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setExpenses(JSON.parse(data));
      }
    } catch (e) {
      console.error("Failed to load car expenses", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to local storage
  const saveExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
      window.dispatchEvent(new CustomEvent("cardo:expenses-updated"));
    } catch (e) {
      console.error("Failed to save car expenses", e);
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) return;

    const newExpense: Expense = {
      id: Date.now(),
      name: name.trim(),
      price: parsedPrice,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    saveExpenses([newExpense, ...expenses]);
    setName("");
    setPrice("");
  };

  const handleDeleteExpense = (id: number) => {
    if (window.confirm("Bu masrafı silmek istediğinize emin misiniz?")) {
      saveExpenses(expenses.filter((item) => item.id !== id));
    }
  };

  const handleToggleCompleted = (id: number) => {
    saveExpenses(
      expenses.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditName(expense.name);
    setEditPrice(expense.price.toString());
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editName.trim() || !editPrice) return;

    const parsedPrice = parseFloat(editPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) return;

    saveExpenses(
      expenses.map((item) =>
        item.id === editingExpense.id
          ? { ...item, name: editName.trim(), price: parsedPrice }
          : item
      )
    );

    setEditingExpense(null);
  };

  // Calculations
  const totalAmount = useMemo(
    () => expenses.reduce((acc, curr) => acc + curr.price, 0),
    [expenses]
  );
  const spentAmount = useMemo(
    () =>
      expenses
        .filter((e) => e.completed)
        .reduce((acc, curr) => acc + curr.price, 0),
    [expenses]
  );
  const remainingAmount = useMemo(
    () =>
      expenses
        .filter((e) => !e.completed)
        .reduce((acc, curr) => acc + curr.price, 0),
    [expenses]
  );

  if (!isLoaded) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface-raised" />;
  }

  return (
    <div className={styles.cardoContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderTitles}>
          <h1>🚗 Hane Car</h1>
          <p className={styles.subtitle}>
            Araç bakım, yakıt, sigorta ve diğer masraflarınızı kolayca yönetin.
          </p>
        </div>
      </header>

      {/* Add Expense Form */}
      <section className={styles.addExpenseSection}>
        <h2 className={styles.sectionTitle}>Yeni Masraf Ekle</h2>
        <form onSubmit={handleAddExpense} className={styles.expenseForm}>
          <div className={styles.formGroup}>
            <label htmlFor="expenseName">Masraf Adı</label>
            <input
              id="expenseName"
              type="text"
              placeholder="Örn: Yağ değişimi, Lastik, Muayene..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="expensePrice">Fiyat (₺)</label>
            <input
              id="expensePrice"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.btnPrimary}>
            <span>+</span> Masraf Ekle
          </button>
        </form>
      </section>

      {/* Expense List */}
      <section className={styles.expenseListSection}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
            Masraf Listesi
          </h2>
          <span className="text-xs font-semibold text-muted">
            {expenses.length} kayıt
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📋</span>
            <p className="font-semibold text-foreground">Henüz masraf eklenmedi</p>
            <p className="text-xs text-muted mt-1">
              Yukarıdaki formu kullanarak ilk araç masrafınızı kaydedin.
            </p>
          </div>
        ) : (
          <div className={styles.expenseList}>
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className={`${styles.expenseItem} ${
                  expense.completed ? styles.completed : ""
                }`}
              >
                <input
                  type="checkbox"
                  className={styles.expenseCheckbox}
                  checked={expense.completed}
                  onChange={() => handleToggleCompleted(expense.id)}
                  title={
                    expense.completed
                      ? "Ödenmedi olarak işaretle"
                      : "Ödendi olarak işaretle"
                  }
                />
                <div className={styles.expenseDetails}>
                  <div className={styles.expenseName}>{expense.name}</div>
                  <div className={styles.expensePrice}>
                    {formatCurrency(expense.price)}
                  </div>
                </div>
                <div className={styles.expenseActions}>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.editBtn}`}
                    onClick={() => handleOpenEdit(expense)}
                    title="Düzenle"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => handleDeleteExpense(expense.id)}
                    title="Sil"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Summary Cards */}
      <section className={styles.summarySection}>
        <div className={`${styles.summaryCard} ${styles.summaryTotal}`}>
          <div className={styles.summaryIcon}>💰</div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Toplam Masraf</span>
            <span className={styles.summaryValue}>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summarySpent}`}>
          <div className={styles.summaryIcon}>✅</div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Ödenen / Harcanan</span>
            <span className={styles.summaryValue}>{formatCurrency(spentAmount)}</span>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryRemaining}`}>
          <div className={styles.summaryIcon}>⏳</div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Kalan Masraf</span>
            <span className={styles.summaryValue}>
              {formatCurrency(remainingAmount)}
            </span>
          </div>
        </div>
      </section>

      {/* Edit Modal */}
      {editingExpense && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Masrafı Düzenle</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setEditingExpense(null)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="editName">Masraf Adı</label>
                <input
                  id="editName"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editPrice">Fiyat (₺)</label>
                <input
                  id="editPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setEditingExpense(null)}
                >
                  İptal
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
