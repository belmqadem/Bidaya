import pandas as pd

# STEP 1: Load the dataset
df = pd.read_csv('ikram/babies.csv', na_values=['NA'])
print("Original shape:", df.shape)
print("\nMissing values before cleaning:")
print(df.isnull().sum())

# STEP 2: Drop the 'case' column (just an ID, useless for prediction)
df = df.drop(columns=['case'])

# STEP 3: Fill missing numerical values with median
for col in ['gestation', 'age', 'height', 'weight']:
    median_val = df[col].median()
    df[col] = df[col].fillna(median_val)
    print(f'Filled {col} missing values with median: {median_val}')

# STEP 4: Fill smoke (binary) with mode
smoke_mode = df['smoke'].mode()[0]
df['smoke'] = df['smoke'].fillna(smoke_mode)
print(f'Filled smoke missing values with mode: {smoke_mode}')

# STEP 5: Save cleaned dataset
df.to_csv('ikram/babies_cleaned.csv', index=False)

print("\nMissing values after cleaning:")
print(df.isnull().sum())
print("\nCleaned dataset saved to ikram/babies_cleaned.csv")
print("Final shape:", df.shape)