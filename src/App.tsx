import { Fragment, useCallback, useEffect, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee, Transaction } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState({
    employeeLoading: false,
    transactionsLoading: false,
  })
  const [transactionState, setTransactionState] = useState<Transaction[]>([])
  console.log(paginatedTransactions)
  useEffect(() => {
    if (paginatedTransactions) {
      setTransactionState((prev) => [...prev, ...paginatedTransactions.data])
    } else if (transactionsByEmployee) {
      setTransactionState((prev) => [...prev, ...transactionsByEmployee])
    } else {
      setTransactionState([])
    }
  }, [paginatedTransactions, transactionsByEmployee])

  const loadAllTransactions = useCallback(async () => {
    setIsLoading({ employeeLoading: true, transactionsLoading: true })
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    setIsLoading((prev) => ({ ...prev, employeeLoading: false }))
    await paginatedTransactionsUtils.fetchAll()

    setIsLoading((prev) => ({ ...prev, transactionsLoading: false }))
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  function displayViewMoreButton() {
    if (transactionState.length !== 0 && paginatedTransactions) {
      if (paginatedTransactions.nextPage !== null) {
        return (
          <button
            className="RampButton"
            disabled={paginatedTransactionsUtils.loading}
            onClick={async () => {
              await loadAllTransactions()
            }}
          >
            View More
          </button>
        )
      }
    }
    // transactionState.length !== 0 && paginatedTransactions && (
    //   <button
    //     className="RampButton"
    //     disabled={paginatedTransactionsUtils.loading}
    //     onClick={async () => {
    //       await loadAllTransactions()
    //     }}
    //   >
    //     View More
    //   </button>
    // )
  }

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading.employeeLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null || newValue.id === "") {
              await loadAllTransactions()
            } else {
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactionState} />

          {displayViewMoreButton()}
        </div>
      </main>
    </Fragment>
  )
}
