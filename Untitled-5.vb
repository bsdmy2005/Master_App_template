


MD IMPORT --> FO_OIS 
1. FO_OIS T-1 COPY TO FO_OIS T (Date Rolls copy , implicit)
2. FO_RBPL T-1 TO FO_RBPL T (Date Rolls copy , implicit) - problem
3. FO_OIS T explicitly COPY FO_RBPL T 


New flow 1:
1. MD IMPORT --> FO_OIS 
2.FO_OIS T-1 COPY TO FO_OIS T (Date Rolls copy , implicit)
2. FO_RBPL T-1 TO FO_RBPL T (Date Rolls copy , implicit) 
3. FO_OIS T-1 explicitly COPY FO_RBPL T-1


New flow :
1. MD IMPORT --> FO_OIS 
2.FO_OIS T-1 COPY TO FO_OIS T (Date Rolls copy , implicit)
2. FO_RBPL T-1 TO FO_RBPL T (Date Rolls copy , implicit) 
3. FO_OIS T-1 explicitly COPY FO_RBPL T-1
4. FO_OIS T explicitly COPY FO_RBPL T 
5. Curve roll 



FO_OIS T-1 COPY FO_RBPL T-1
FO_OIS T COPY FO_RBPL T 
Date roll 