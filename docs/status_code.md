The return value of `getActivities` is a list of object. Each object have a `status` property, which indicates the state of the result.

| Status-Code | Description                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 0           | All pages can parsed each with one or more activities                                                                            |
| 1           | Unable to identifiy an implementation with the content of the first page                                                         |
| 2           | More than one implementation was found for the first page                                                                        |
| 3           | Critical unforeseen error during parsing, abort.                                                                                 |
| 4           | Unable to parse given file type                                                                                                  |
| 5           | No activities found for a valid document                                                                                         |
| 7           | The type of this document is unknown for the matching implementation.                                                            |
| 8           | This document isn't a valid order/dividend document like a cost or a split information. Please use the order execution document. |
